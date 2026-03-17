#!/usr/bin/env python3
"""
AOCN Open Claw Bot — Telegram Arbitrage Alert Bot

Features:
  - /start — Welcome message with command list
  - /scan — Immediate market scan with top opportunities
  - /top5 — Show top 5 arbitrage opportunities
  - /alert — Enable auto-push alerts
  - /stop — Disable auto-push alerts
  - /stats — Show market statistics
  - /sbt — Show latest SBT updates
  - Auto-monitoring: reads from shared data volume, pushes alerts

Usage:
  1. Set TELEGRAM_BOT_TOKEN environment variable
  2. Run: python -m bot.main
  3. Or via Docker: docker compose --profile bot up -d
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ─── Configuration ───
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
ALERT_THRESHOLD_PCT = float(os.getenv("ALERT_THRESHOLD_PCT", "5"))
DATA_DIR = Path(os.getenv("DATA_DIR", "/app/data"))
CHECK_INTERVAL = 30  # Check for new data every 30 seconds

# ─── Logging ───
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/app/logs/bot.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("aocn-bot")

# ─── State ───
alert_subscribers: set[int] = set()
last_alert_cards: dict[str, float] = {}  # card_id -> last_alerted_spread
alert_cooldowns: dict[str, float] = {}  # card_id -> timestamp


def load_market_data() -> dict | None:
    """Load latest market snapshot from shared data volume."""
    snapshot_file = DATA_DIR / "market_snapshot.json"
    try:
        if snapshot_file.exists():
            data = json.loads(snapshot_file.read_text())
            return data
    except Exception as e:
        logger.warning(f"Failed to load market data: {e}")
    return None


def find_arbitrage(data: dict, min_spread: float = 5.0) -> list[dict]:
    """Find arbitrage opportunities from market snapshot."""
    cards = data.get("cards", [])
    opportunities = []
    for card in cards:
        spread_pct = card.get("spreadPct", 0)
        if spread_pct >= min_spread and card.get("price", 0) > 0:
            opportunities.append(card)
    return sorted(opportunities, key=lambda x: x.get("spreadPct", 0), reverse=True)


def format_card(card: dict, index: int = 0) -> str:
    """Format a single card for Telegram message."""
    name = card.get("name", "Unknown")[:50]
    price = card.get("price", 0)
    fmv = card.get("fmv", 0)
    spread = card.get("spread", 0)
    spread_pct = card.get("spreadPct", 0)
    grade = card.get("grade", "")

    prefix = f"#{index} " if index > 0 else ""
    return (
        f"{prefix}*{name}*\n"
        f"  Grade: {grade}\n"
        f"  Price: ${price:.2f} | FMV: ${fmv:.2f}\n"
        f"  Spread: +{spread_pct:.1f}% (${spread:.2f})\n"
    )


# ─── Command Handlers ───
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Welcome message with command list."""
    text = (
        "*AOCN Open Claw Bot*\n\n"
        "Real-time Renaiss Protocol market arbitrage monitor.\n\n"
        "*Commands:*\n"
        "/scan — Scan market now\n"
        "/top5 — Top 5 opportunities\n"
        "/alert — Enable auto alerts\n"
        "/stop — Disable auto alerts\n"
        "/stats — Market statistics\n"
        "/sbt — Latest SBT info\n\n"
        "_Data refreshes every 15 seconds._"
    )
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Renaiss Marketplace", url="https://www.renaiss.xyz/marketplace"),
            InlineKeyboardButton("AOCN Dashboard", url="https://aocn-ten.vercel.app"),
        ]
    ])
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=keyboard)


async def cmd_scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Immediate market scan."""
    await update.message.reply_text("Scanning Renaiss market...")

    data = load_market_data()
    if not data:
        await update.message.reply_text("No market data available. Scraper may be starting up.")
        return

    opportunities = find_arbitrage(data, ALERT_THRESHOLD_PCT)
    ts = data.get("timestamp", "unknown")
    total = data.get("total_cards", 0)

    if not opportunities:
        await update.message.reply_text(
            f"No arbitrage opportunities above {ALERT_THRESHOLD_PCT}%.\n"
            f"Total cards: {total} | Last update: {ts}"
        )
        return

    header = (
        f"*Market Scan Results*\n"
        f"Total: {total} cards | Opportunities: {len(opportunities)}\n"
        f"Last update: {ts}\n\n"
    )

    # Show top 10
    cards_text = "\n".join(format_card(c, i + 1) for i, c in enumerate(opportunities[:10]))
    await update.message.reply_text(header + cards_text, parse_mode="Markdown")


async def cmd_top5(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show top 5 arbitrage opportunities."""
    data = load_market_data()
    if not data:
        await update.message.reply_text("No market data available.")
        return

    opportunities = find_arbitrage(data, 0)[:5]
    if not opportunities:
        await update.message.reply_text("No opportunities found.")
        return

    text = "*Top 5 Arbitrage Opportunities*\n\n"
    text += "\n".join(format_card(c, i + 1) for i, c in enumerate(opportunities))
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_alert(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Enable auto-push alerts."""
    chat_id = update.effective_chat.id
    alert_subscribers.add(chat_id)
    await update.message.reply_text(
        f"Auto alerts enabled.\n"
        f"You will receive notifications when spread > {ALERT_THRESHOLD_PCT}%.\n"
        f"Use /stop to disable."
    )
    logger.info(f"Alert subscriber added: {chat_id}")


async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Disable auto-push alerts."""
    chat_id = update.effective_chat.id
    alert_subscribers.discard(chat_id)
    await update.message.reply_text("Auto alerts disabled.")
    logger.info(f"Alert subscriber removed: {chat_id}")


async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show market statistics."""
    data = load_market_data()
    if not data:
        await update.message.reply_text("No market data available.")
        return

    cards = data.get("cards", [])
    total = len(cards)
    listed = sum(1 for c in cards if c.get("listed", c.get("price", 0) > 0))
    arb = sum(1 for c in cards if c.get("spreadPct", 0) > 5)
    avg_spread = sum(c.get("spreadPct", 0) for c in cards if c.get("spreadPct", 0) > 0) / max(1, sum(1 for c in cards if c.get("spreadPct", 0) > 0))

    text = (
        f"*Market Statistics*\n\n"
        f"Total Cards: {total}\n"
        f"Listed: {listed}\n"
        f"Arbitrage (>5%): {arb}\n"
        f"Avg Spread: {avg_spread:.1f}%\n"
        f"Last Update: {data.get('timestamp', 'N/A')}"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_sbt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show latest SBT information."""
    text = (
        "*Renaiss SBT Atlas*\n\n"
        "69 SBTs cataloged in the AOCN database.\n\n"
        "View the complete atlas at:\n"
        "https://aocn-ten.vercel.app (SBT Atlas tab)\n\n"
        "Categories: Social, Trading, Gacha, Event, Special, Community\n"
        "Status: Available / Ended / Special Application"
    )
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("View SBT Atlas", url="https://aocn-ten.vercel.app")]
    ])
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=keyboard)


# ─── Auto Alert Loop ───
async def alert_loop(app: Application):
    """Background loop to check for new arbitrage opportunities and push alerts."""
    logger.info("Alert loop started")
    while True:
        try:
            if alert_subscribers:
                data = load_market_data()
                if data:
                    opportunities = find_arbitrage(data, ALERT_THRESHOLD_PCT)
                    now = datetime.now(timezone.utc).timestamp()

                    for card in opportunities[:5]:
                        cid = card.get("id", "")
                        spread = card.get("spreadPct", 0)

                        # Check cooldown (5 min per card)
                        if cid in alert_cooldowns:
                            if now - alert_cooldowns[cid] < 300:
                                continue

                        # Check if spread changed significantly
                        if cid in last_alert_cards:
                            if abs(spread - last_alert_cards[cid]) < 2:
                                continue

                        # Send alert
                        alert_text = (
                            f"*Arbitrage Alert*\n\n"
                            f"{format_card(card)}\n"
                            f"_View on AOCN Dashboard_"
                        )

                        for chat_id in alert_subscribers.copy():
                            try:
                                await app.bot.send_message(
                                    chat_id=chat_id,
                                    text=alert_text,
                                    parse_mode="Markdown",
                                )
                            except Exception as e:
                                logger.warning(f"Failed to send alert to {chat_id}: {e}")
                                alert_subscribers.discard(chat_id)

                        last_alert_cards[cid] = spread
                        alert_cooldowns[cid] = now

        except Exception as e:
            logger.error(f"Alert loop error: {e}")

        await asyncio.sleep(CHECK_INTERVAL)


# ─── Main ───
def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set. Exiting.")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    # Register handlers
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("scan", cmd_scan))
    app.add_handler(CommandHandler("top5", cmd_top5))
    app.add_handler(CommandHandler("alert", cmd_alert))
    app.add_handler(CommandHandler("stop", cmd_stop))
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("sbt", cmd_sbt))

    # Start alert loop as background task
    async def post_init(app: Application):
        asyncio.create_task(alert_loop(app))

    app.post_init = post_init

    logger.info("AOCN Open Claw Bot starting...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
