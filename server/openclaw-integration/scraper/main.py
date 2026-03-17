#!/usr/bin/env python3
"""
AOCN OpenClaw Scraper — Main Entry Point

Architecture:
  1. Primary: Direct tRPC API calls (fastest, ~2-5s)
  2. Fallback: CDP browser scraping via persistent Chromium (10-15s)
  3. Output: JSON snapshot + price history + webhook push

Runs as a daemon with configurable interval (default 15s).
Connects to persistent Chromium via Chrome DevTools Protocol.
"""

import os
import sys
import json
import time
import signal
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

import yaml
import aiohttp
from playwright.async_api import async_playwright

# ─── Configuration ───
CONFIG_PATH = os.getenv("CONFIG_PATH", "/app/config.yaml")
CDP_ENDPOINT = os.getenv("CDP_ENDPOINT", "ws://localhost:9222")
SCRAPE_INTERVAL = int(os.getenv("SCRAPE_INTERVAL", "15"))
API_WEBHOOK_URL = os.getenv("API_WEBHOOK_URL", "")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ─── Logging ───
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/app/logs/scraper.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("aocn-scraper")


def load_config() -> dict:
    """Load YAML configuration file."""
    try:
        with open(CONFIG_PATH, "r") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        logger.warning(f"Config file not found at {CONFIG_PATH}, using defaults")
        return {}


class RenaissScraper:
    """
    Dual-mode scraper for Renaiss marketplace.
    
    Mode 1 (Primary): Direct tRPC API calls — no browser needed, ~2-5s latency.
    Mode 2 (Fallback): CDP browser scraping — uses persistent Chromium, ~10-15s latency.
    """

    def __init__(self, config: dict):
        self.config = config
        self.trpc_endpoint = config.get("scraper", {}).get(
            "trpc_endpoint", "https://www.renaiss.xyz/trpc"
        )
        self.target_url = config.get("scraper", {}).get(
            "target_url", "https://www.renaiss.xyz/marketplace"
        )
        self.timeout = config.get("scraper", {}).get("timeout", 30)
        self.max_retries = config.get("scraper", {}).get("max_retries", 3)
        self.retry_delay = config.get("scraper", {}).get("retry_delay", 2)

        # Data storage
        self.data_file = Path(
            config.get("output", {}).get("data_file", "/app/data/market_snapshot.json")
        )
        self.history_file = Path(
            config.get("output", {}).get("history_file", "/app/data/price_history.json")
        )
        self.max_history = config.get("output", {}).get("max_history_per_card", 1000)

        # Browser state
        self._playwright = None
        self._browser = None
        self._page = None

        # Stats
        self.cycle_count = 0
        self.error_count = 0
        self.last_success = None
        self.last_card_count = 0

    async def start(self):
        """Initialize resources."""
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        logger.info("AOCN OpenClaw Scraper initialized")
        logger.info(f"  tRPC endpoint: {self.trpc_endpoint}")
        logger.info(f"  CDP endpoint: {CDP_ENDPOINT}")
        logger.info(f"  Interval: {SCRAPE_INTERVAL}s")

    async def stop(self):
        """Cleanup resources."""
        if self._page:
            try:
                await self._page.close()
            except Exception:
                pass
        if self._browser:
            try:
                await self._browser.close()
            except Exception:
                pass
        if self._playwright:
            try:
                await self._playwright.stop()
            except Exception:
                pass
        logger.info("Scraper stopped, resources cleaned up")

    # ─── Mode 1: Direct tRPC API ───
    async def fetch_via_trpc(self) -> list[dict] | None:
        """
        Fetch marketplace data directly from Renaiss tRPC API.
        This is the fastest method (~2-5s) and does not require a browser.
        """
        procedures = [
            # Main marketplace listing
            "marketplace.getListings",
            "marketplace.getCards",
            "card.getAll",
        ]

        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        ) as session:
            for procedure in procedures:
                for attempt in range(self.max_retries):
                    try:
                        # tRPC batch call format
                        url = f"{self.trpc_endpoint}/{procedure}"
                        params = {
                            "batch": "1",
                            "input": json.dumps(
                                {"0": {"json": {"limit": 10000, "offset": 0}}}
                            ),
                        }
                        headers = {
                            "User-Agent": "AOCN-OpenClaw/2.0",
                            "Accept": "application/json",
                            "Referer": "https://www.renaiss.xyz/",
                        }

                        async with session.get(
                            url, params=params, headers=headers
                        ) as resp:
                            if resp.status == 200:
                                data = await resp.json()
                                cards = self._parse_trpc_response(data)
                                if cards:
                                    logger.info(
                                        f"tRPC success via {procedure}: {len(cards)} cards"
                                    )
                                    return cards
                            else:
                                logger.debug(
                                    f"tRPC {procedure} returned {resp.status}"
                                )

                    except asyncio.TimeoutError:
                        logger.warning(
                            f"tRPC timeout on {procedure} (attempt {attempt + 1})"
                        )
                    except Exception as e:
                        logger.warning(
                            f"tRPC error on {procedure} (attempt {attempt + 1}): {e}"
                        )

                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay * (attempt + 1))

        logger.warning("All tRPC procedures failed, falling back to browser")
        return None

    def _parse_trpc_response(self, data: any) -> list[dict] | None:
        """Parse tRPC response into normalized card list."""
        try:
            # tRPC batch response format: [{"result": {"data": {"json": ...}}}]
            if isinstance(data, list) and len(data) > 0:
                result = data[0].get("result", {}).get("data", {})
                items = result.get("json", result) if isinstance(result, dict) else result
            elif isinstance(data, dict):
                items = data.get("result", {}).get("data", {}).get("json", [])
            else:
                return None

            if not isinstance(items, list):
                # Try nested structures
                if isinstance(items, dict):
                    items = items.get("items", items.get("cards", items.get("listings", [])))
                if not isinstance(items, list):
                    return None

            cards = []
            for item in items:
                card = self._normalize_card(item)
                if card:
                    cards.append(card)

            return cards if len(cards) > 0 else None

        except Exception as e:
            logger.debug(f"tRPC parse error: {e}")
            return None

    def _normalize_card(self, raw: dict) -> dict | None:
        """Normalize a raw card object into standard format."""
        try:
            # Handle various field naming conventions
            card_id = raw.get("id") or raw.get("itemId") or raw.get("tokenId", "")
            name = raw.get("name") or raw.get("title", "Unknown")
            price = float(raw.get("price") or raw.get("listPrice") or 0)
            fmv = float(raw.get("fmv") or raw.get("fairMarketValue") or raw.get("estimatedValue") or 0)
            buyback = float(raw.get("buyback") or raw.get("buybackPrice") or 0)

            if not card_id:
                return None

            spread = fmv - price if price > 0 and fmv > 0 else 0
            spread_pct = round((spread / price) * 100, 2) if price > 0 else 0

            return {
                "id": str(card_id),
                "itemId": str(raw.get("itemId", card_id)),
                "tokenId": str(raw.get("tokenId", "")),
                "name": name,
                "setName": raw.get("setName") or raw.get("set", ""),
                "set": raw.get("set") or raw.get("setName", ""),
                "price": price,
                "fmv": fmv,
                "buyback": buyback,
                "spread": round(spread, 2),
                "spreadPct": spread_pct,
                "imgUrl": raw.get("imgUrl") or raw.get("image") or raw.get("imageUrl", ""),
                "grade": raw.get("grade") or raw.get("grading", ""),
                "gradingCompany": raw.get("gradingCompany") or raw.get("grader", ""),
                "year": int(raw.get("year", 0)),
                "language": raw.get("language", ""),
                "cardNumber": raw.get("cardNumber") or raw.get("number", ""),
                "serial": raw.get("serial") or raw.get("serialNumber", ""),
                "vaultLocation": raw.get("vaultLocation", ""),
                "ownerUsername": raw.get("ownerUsername") or raw.get("owner", ""),
                "listed": bool(raw.get("listed", price > 0)),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as e:
            logger.debug(f"Card normalize error: {e}")
            return None

    # ─── Mode 2: CDP Browser Scraping ───
    async def _ensure_browser(self):
        """Connect to persistent Chromium via CDP."""
        if self._page and not self._page.is_closed():
            return

        try:
            if not self._playwright:
                self._playwright = await async_playwright().start()

            logger.info(f"Connecting to Chromium CDP at {CDP_ENDPOINT}...")
            self._browser = await self._playwright.chromium.connect_over_cdp(
                CDP_ENDPOINT,
                timeout=15000,
            )

            # Reuse existing context or create new one
            contexts = self._browser.contexts
            if contexts:
                context = contexts[0]
                pages = context.pages
                self._page = pages[0] if pages else await context.new_page()
            else:
                context = await self._browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                )
                self._page = await context.new_page()

            logger.info("Browser connected successfully")

        except Exception as e:
            logger.error(f"Browser connection failed: {e}")
            self._page = None
            raise

    async def fetch_via_browser(self) -> list[dict] | None:
        """
        Fetch marketplace data by intercepting network requests in the browser.
        Uses persistent Chromium to avoid cold-start delays.
        """
        for attempt in range(self.max_retries):
            try:
                await self._ensure_browser()

                captured_data = []

                async def intercept_response(response):
                    """Capture tRPC/API responses from the page."""
                    url = response.url
                    if "trpc" in url or "api" in url:
                        try:
                            if response.status == 200:
                                body = await response.json()
                                captured_data.append(body)
                        except Exception:
                            pass

                self._page.on("response", intercept_response)

                try:
                    # Navigate to marketplace
                    await self._page.goto(
                        self.target_url,
                        wait_until="networkidle",
                        timeout=30000,
                    )

                    # Wait for data to load
                    await self._page.wait_for_timeout(3000)

                    # Try to extract from intercepted API calls
                    for data in captured_data:
                        cards = self._parse_trpc_response(data)
                        if cards and len(cards) > 10:
                            logger.info(f"Browser intercept: {len(cards)} cards")
                            return cards

                    # Fallback: extract from DOM
                    cards = await self._extract_from_dom()
                    if cards:
                        return cards

                finally:
                    self._page.remove_listener("response", intercept_response)

            except Exception as e:
                logger.warning(f"Browser scrape attempt {attempt + 1} failed: {e}")
                # Reset browser connection on error
                self._page = None
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))

        return None

    async def _extract_from_dom(self) -> list[dict] | None:
        """Extract card data directly from the rendered DOM."""
        try:
            # Execute JS to extract card data from React state or DOM
            result = await self._page.evaluate("""
                () => {
                    // Try React internal state
                    const root = document.getElementById('root') || document.getElementById('__next');
                    if (root && root._reactRootContainer) {
                        // React 17
                        const fiber = root._reactRootContainer._internalRoot?.current;
                        // Walk fiber tree to find card data...
                    }
                    
                    // Try extracting from visible card elements
                    const cards = [];
                    const cardElements = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="item"]');
                    cardElements.forEach(el => {
                        const name = el.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim();
                        const price = el.querySelector('[class*="price"]')?.textContent?.trim();
                        const img = el.querySelector('img')?.src;
                        if (name && price) {
                            cards.push({ name, price: parseFloat(price.replace(/[^0-9.]/g, '')), imgUrl: img || '' });
                        }
                    });
                    
                    // Try __NEXT_DATA__ or window state
                    if (window.__NEXT_DATA__?.props?.pageProps?.cards) {
                        return window.__NEXT_DATA__.props.pageProps.cards;
                    }
                    
                    return cards.length > 0 ? cards : null;
                }
            """)

            if result and isinstance(result, list):
                cards = [self._normalize_card(item) for item in result]
                cards = [c for c in cards if c is not None]
                if cards:
                    logger.info(f"DOM extraction: {len(cards)} cards")
                    return cards

        except Exception as e:
            logger.debug(f"DOM extraction error: {e}")

        return None

    # ─── Data Processing ───
    def save_snapshot(self, cards: list[dict]):
        """Save current market snapshot to JSON file."""
        snapshot = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_cards": len(cards),
            "listed_cards": sum(1 for c in cards if c.get("listed", c.get("price", 0) > 0)),
            "arbitrage_count": sum(1 for c in cards if c.get("spreadPct", 0) > 5),
            "cards": cards,
        }

        self.data_file.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
        logger.debug(f"Snapshot saved: {len(cards)} cards")

    def update_history(self, cards: list[dict]):
        """Append price data to history file."""
        try:
            history = json.loads(self.history_file.read_text()) if self.history_file.exists() else {}
        except (json.JSONDecodeError, Exception):
            history = {}

        now = datetime.now(timezone.utc).isoformat()
        for card in cards:
            cid = card.get("id", "")
            if not cid or card.get("price", 0) <= 0:
                continue

            if cid not in history:
                history[cid] = []

            history[cid].append({
                "timestamp": now,
                "price": card["price"],
                "fmv": card.get("fmv", 0),
                "spreadPct": card.get("spreadPct", 0),
            })

            # Trim old entries
            if len(history[cid]) > self.max_history:
                history[cid] = history[cid][-self.max_history:]

        self.history_file.write_text(json.dumps(history, ensure_ascii=False))

    async def push_webhook(self, cards: list[dict]):
        """Push data to webhook URL (e.g., Vercel API)."""
        if not API_WEBHOOK_URL:
            return

        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            ) as session:
                payload = {
                    "source": "openclaw-scraper",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "cards": cards[:100],  # Limit payload size
                    "stats": {
                        "total": len(cards),
                        "listed": sum(1 for c in cards if c.get("listed")),
                        "arbitrage": sum(1 for c in cards if c.get("spreadPct", 0) > 5),
                    },
                }
                async with session.post(
                    API_WEBHOOK_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                ) as resp:
                    if resp.status == 200:
                        logger.debug("Webhook push successful")
                    else:
                        logger.warning(f"Webhook returned {resp.status}")
        except Exception as e:
            logger.warning(f"Webhook push failed: {e}")

    # ─── Main Scrape Cycle ───
    async def scrape_cycle(self) -> bool:
        """
        Execute one scrape cycle.
        Returns True if successful, False otherwise.
        """
        self.cycle_count += 1
        start_time = time.monotonic()

        # Try tRPC first (fastest)
        cards = await self.fetch_via_trpc()

        # Fallback to browser if tRPC fails
        if not cards:
            cards = await self.fetch_via_browser()

        if not cards:
            self.error_count += 1
            logger.error(f"Cycle #{self.cycle_count} failed — no data from any source")
            return False

        elapsed = time.monotonic() - start_time
        self.last_success = datetime.now(timezone.utc).isoformat()
        self.last_card_count = len(cards)

        # Save and push
        self.save_snapshot(cards)
        self.update_history(cards)
        await self.push_webhook(cards)

        arb_count = sum(1 for c in cards if c.get("spreadPct", 0) > 5)
        logger.info(
            f"Cycle #{self.cycle_count} OK — {len(cards)} cards, "
            f"{arb_count} arbitrage, {elapsed:.1f}s"
        )
        return True


# ─── Main Loop ───
async def main():
    config = load_config()
    scraper = RenaissScraper(config)
    await scraper.start()

    # Graceful shutdown
    shutdown_event = asyncio.Event()

    def handle_signal(sig, frame):
        logger.info(f"Received signal {sig}, shutting down...")
        shutdown_event.set()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info(f"Starting scrape loop (interval: {SCRAPE_INTERVAL}s)")

    try:
        while not shutdown_event.is_set():
            try:
                await scraper.scrape_cycle()
            except Exception as e:
                logger.error(f"Unexpected error in scrape cycle: {e}", exc_info=True)

            # Wait for next cycle or shutdown
            try:
                await asyncio.wait_for(
                    shutdown_event.wait(), timeout=SCRAPE_INTERVAL
                )
            except asyncio.TimeoutError:
                pass  # Normal — interval elapsed, continue loop

    finally:
        await scraper.stop()
        logger.info("Scraper shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
