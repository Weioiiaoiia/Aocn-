# AOCN OpenClaw Integration

Persistent browser + market scraper + Telegram bot for real-time Renaiss Protocol monitoring.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                      │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │ Chromium  │◄──│ AOCN Scraper │──►│  AOCN Bot   │ │
│  │ (CDP)     │   │ (Python)     │   │ (Telegram)  │ │
│  │ Port 9222 │   │ 15s interval │   │ Auto alerts │ │
│  └──────────┘   └──────┬───────┘   └─────────────┘ │
│                         │                            │
│                    ┌────▼────┐                       │
│                    │  Data   │                       │
│                    │ Volume  │                       │
│                    └────┬────┘                       │
│                         │                            │
└─────────────────────────┼───────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  Vercel   │
                    │  API      │
                    │ (webhook) │
                    └───────────┘
```

## Quick Start

```bash
# 1. Clone and navigate
cd server/openclaw-integration

# 2. Configure environment
cp .env.example .env
# Edit .env with your tokens

# 3. Start scraper only
docker compose up -d

# 4. Start with Telegram bot
docker compose --profile bot up -d

# 5. View logs
docker compose logs -f aocn-scraper
```

## Dual-Mode Scraping

The scraper uses two modes for maximum reliability:

| Mode | Method | Latency | Reliability |
|------|--------|---------|-------------|
| Primary | Direct tRPC API | 2-5s | High |
| Fallback | CDP Browser | 10-15s | Very High |

**Mode 1 (tRPC)**: Directly calls Renaiss API endpoints. No browser needed, fastest method.

**Mode 2 (CDP)**: Connects to persistent Chromium via Chrome DevTools Protocol. Intercepts network requests and extracts data from the rendered page. Used as fallback when API is unavailable.

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/scan` | Immediate market scan |
| `/top5` | Top 5 arbitrage opportunities |
| `/alert` | Enable auto-push alerts |
| `/stop` | Disable auto-push alerts |
| `/stats` | Market statistics |
| `/sbt` | SBT atlas info |

## Skills

### SBT Enricher

AI-powered SBT description enrichment:

```bash
python skills/sbt_enricher.py \
  --input data/sbt-atlas.json \
  --output data/sbt-atlas-enriched.json
```

## Configuration

See `config.yaml` for all available settings:

- **scraper**: Target URLs, intervals, retry logic
- **browser**: CDP settings, viewport, timeouts
- **output**: Data file paths, history limits
- **alerts**: Threshold, cooldown, rate limiting
- **logging**: Level, file rotation

## Data Files

| File | Description |
|------|-------------|
| `data/market_snapshot.json` | Latest market state |
| `data/price_history.json` | Historical price data |

## Error Handling

- Automatic retry with exponential backoff (3 attempts)
- Browser reconnection on CDP disconnect
- Graceful degradation: tRPC → Browser → cached data
- Signal handling (SIGINT/SIGTERM) for clean shutdown
- Structured logging to stdout + file

## Development

```bash
# Run scraper locally (without Docker)
pip install -r requirements.txt
playwright install chromium
CDP_ENDPOINT=ws://localhost:9222 python -m scraper.main

# Run bot locally
TELEGRAM_BOT_TOKEN=your_token python -m bot.main
```
