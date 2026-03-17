/*
 * AOCN Open Claw — Rewritten with full integration code
 * Dual-mode: Telegram Bot + Docker Compose self-hosted scraper
 */
import { useLang } from '@/contexts/LanguageContext';
import { Bot, Copy, Check, Terminal, Rocket, Server, Shield, Zap, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

// ── Telegram Bot Code (complete, runnable) ──
const BOT_CODE = `#!/usr/bin/env python3
"""
AOCN Open Claw Bot — Renaiss Market Arbitrage Monitor for Telegram
Auto-monitors Renaiss marketplace, finds underpriced cards, pushes alerts.

Setup:
  1. pip install python-telegram-bot requests aiohttp
  2. export TELEGRAM_BOT_TOKEN=your_token_from_BotFather
  3. python open_claw_bot.py

Commands: /start /scan /top5 /alert /stop /stats
"""
import os, json, asyncio, logging
from datetime import datetime, timezone
from pathlib import Path
import aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
AOCN_API = os.getenv("AOCN_API_URL", "https://aocn-ten.vercel.app/api")
ALERT_THRESHOLD = float(os.getenv("ALERT_THRESHOLD_PCT", "5"))
CHECK_INTERVAL = 30

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("openclaw-bot")

alert_subs: set[int] = set()
last_alerts: dict[str, float] = {}

async def fetch_cards() -> dict | None:
    """Fetch card data from AOCN API."""
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as s:
            async with s.get(f"{AOCN_API}/cards?limit=100&sortBy=spreadPct&sortOrder=desc&listedOnly=true") as r:
                if r.status == 200:
                    return await r.json()
    except Exception as e:
        logger.warning(f"API fetch failed: {e}")
    return None

def find_arb(data: dict, min_pct: float = 5.0) -> list[dict]:
    cards = data.get("cards", [])
    return [c for c in cards if c.get("spreadPct", 0) >= min_pct and c.get("price", 0) > 0]

def fmt_card(c: dict, i: int = 0) -> str:
    prefix = f"#{i} " if i > 0 else ""
    return (
        f"{prefix}*{c.get('name', '?')[:45]}*\\n"
        f"  $\${c.get('price', 0):.2f} -> FMV $\${c.get('fmv', 0):.2f}\\n"
        f"  +{c.get('spreadPct', 0):.1f}% ($\${c.get('spread', 0):.2f})\\n"
    )

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = (
        "*AOCN Open Claw Bot*\\n\\n"
        "Real-time Renaiss arbitrage monitor.\\n\\n"
        "/scan — Scan market now\\n"
        "/top5 — Top 5 deals\\n"
        "/alert — Enable auto alerts\\n"
        "/stop — Disable alerts\\n"
        "/stats — Market stats\\n"
    )
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("Marketplace", url="https://www.renaiss.xyz/marketplace"),
        InlineKeyboardButton("AOCN", url="https://aocn-ten.vercel.app"),
    ]])
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=kb)

async def cmd_scan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Scanning Renaiss market...")
    data = await fetch_cards()
    if not data:
        await update.message.reply_text("No data available. Try again later.")
        return
    opps = find_arb(data, ALERT_THRESHOLD)
    stats = data.get("stats", {})
    header = f"*Scan Results* — {stats.get('totalCards', 0)} cards, {len(opps)} opportunities\\n\\n"
    body = "\\n".join(fmt_card(c, i+1) for i, c in enumerate(opps[:10]))
    await update.message.reply_text(header + (body or "No opportunities found."), parse_mode="Markdown")

async def cmd_top5(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    data = await fetch_cards()
    if not data:
        await update.message.reply_text("No data available.")
        return
    opps = find_arb(data, 0)[:5]
    text = "*Top 5 Arbitrage*\\n\\n" + "\\n".join(fmt_card(c, i+1) for i, c in enumerate(opps))
    await update.message.reply_text(text or "No data.", parse_mode="Markdown")

async def cmd_alert(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    alert_subs.add(update.effective_chat.id)
    await update.message.reply_text(f"Alerts ON (threshold: {ALERT_THRESHOLD}%). /stop to disable.")

async def cmd_stop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    alert_subs.discard(update.effective_chat.id)
    await update.message.reply_text("Alerts OFF.")

async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    data = await fetch_cards()
    if not data:
        await update.message.reply_text("No data.")
        return
    s = data.get("stats", {})
    text = (
        f"*Market Stats*\\n\\n"
        f"Total: {s.get('totalCards', 0)}\\n"
        f"Listed: {s.get('listedCards', 0)}\\n"
        f"Arbitrage: {s.get('arbitrageCount', 0)}\\n"
        f"Avg Spread: {s.get('avgSpread', 0):.1f}%"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

async def alert_loop(app: Application):
    while True:
        try:
            if alert_subs:
                data = await fetch_cards()
                if data:
                    now = datetime.now(timezone.utc).timestamp()
                    for c in find_arb(data, ALERT_THRESHOLD)[:3]:
                        cid = c.get("id", "")
                        if cid in last_alerts and now - last_alerts[cid] < 300:
                            continue
                        text = f"*Alert*\\n\\n{fmt_card(c)}"
                        for chat_id in list(alert_subs):
                            try:
                                await app.bot.send_message(chat_id, text, parse_mode="Markdown")
                            except Exception:
                                alert_subs.discard(chat_id)
                        last_alerts[cid] = now
        except Exception as e:
            logger.error(f"Alert loop error: {e}")
        await asyncio.sleep(CHECK_INTERVAL)

def main():
    if not BOT_TOKEN:
        print("Set TELEGRAM_BOT_TOKEN env var first!")
        return
    app = Application.builder().token(BOT_TOKEN).build()
    for cmd, fn in [("start", cmd_start), ("scan", cmd_scan), ("top5", cmd_top5),
                    ("alert", cmd_alert), ("stop", cmd_stop), ("stats", cmd_stats)]:
        app.add_handler(CommandHandler(cmd, fn))
    app.post_init = lambda a: asyncio.create_task(alert_loop(a))
    logger.info("AOCN Open Claw Bot starting...")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
`;

// ── Docker Compose Code ──
const DOCKER_CODE = `# AOCN OpenClaw — Docker Compose
# Usage: cp .env.example .env && docker compose up -d

version: "3.9"
services:
  chromium:
    image: zenika/alpine-chrome:with-puppeteer
    container_name: aocn-chromium
    restart: unless-stopped
    command: [chromium-browser, --headless=new, --no-sandbox,
              --remote-debugging-address=0.0.0.0,
              --remote-debugging-port=9222,
              --user-data-dir=/data/chrome-profile]
    ports: ["9222:9222"]
    volumes: [chrome-data:/data/chrome-profile]
    mem_limit: 1g

  aocn-scraper:
    build: { context: ., dockerfile: Dockerfile.scraper }
    container_name: aocn-scraper
    restart: unless-stopped
    depends_on:
      chromium: { condition: service_healthy }
    environment:
      - CDP_ENDPOINT=ws://chromium:9222
      - SCRAPE_INTERVAL=15
    volumes: [./data:/app/data, ./logs:/app/logs]

  aocn-bot:
    build: { context: ., dockerfile: Dockerfile.bot }
    container_name: aocn-bot
    restart: unless-stopped
    environment:
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
      - ALERT_THRESHOLD_PCT=5
    volumes: [./data:/app/data]
    profiles: [bot]

volumes:
  chrome-data:
`;

type TabId = 'bot' | 'docker' | 'guide';

export default function OpenClaw() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<TabId>('bot');
  const [copiedBot, setCopiedBot] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);

  const copyToClipboard = useCallback((text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }, []);

  const features = [
    { icon: Zap, title: t('15s 实时延迟', '15s Real-time'), desc: t('tRPC API + CDP 浏览器双模式', 'Dual-mode: tRPC API + CDP browser'), color: 'text-emerald-500' },
    { icon: Bot, title: t('TG 套利推送', 'TG Arb Alerts'), desc: t('自动扫描 + 阈值推送', 'Auto-scan + threshold alerts'), color: 'text-blue-500' },
    { icon: Server, title: t('Docker 一键部署', 'Docker Deploy'), desc: t('持久化浏览器 + 自动重启', 'Persistent browser + auto-restart'), color: 'text-purple-500' },
    { icon: Shield, title: t('错误重试', 'Error Recovery'), desc: t('指数退避 + 优雅降级', 'Exponential backoff + graceful fallback'), color: 'text-amber-500' },
  ];

  const steps = [
    { num: '01', title: t('获取 Telegram Bot Token', 'Get Telegram Bot Token'), desc: t('在 Telegram 找到 @BotFather → /newbot → 复制 token', 'Find @BotFather on Telegram → /newbot → copy token') },
    { num: '02', title: t('安装依赖', 'Install Dependencies'), desc: 'pip install python-telegram-bot aiohttp requests' },
    { num: '03', title: t('设置环境变量', 'Set Environment'), desc: 'export TELEGRAM_BOT_TOKEN=your_token_here' },
    { num: '04', title: t('运行机器人', 'Run Bot'), desc: 'python open_claw_bot.py' },
    { num: '05', title: t('（可选）Docker 部署', '(Optional) Docker Deploy'), desc: 'cp .env.example .env && docker compose up -d' },
    { num: '06', title: t('（可选）启用 TG Bot', '(Optional) Enable TG Bot'), desc: 'docker compose --profile bot up -d' },
  ];

  const tabs: { id: TabId; label: string; icon: typeof Terminal }[] = [
    { id: 'bot', label: t('Telegram Bot', 'Telegram Bot'), icon: Bot },
    { id: 'docker', label: t('Docker 部署', 'Docker Deploy'), icon: Server },
    { id: 'guide', label: t('部署指南', 'Deploy Guide'), icon: Rocket },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Open Claw AI</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
            v2.0
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            '完整的 Renaiss 市场套利监控系统。双模式抓取（tRPC + CDP 浏览器），Telegram 自动推送，Docker 一键部署。',
            'Complete Renaiss market arbitrage monitoring system. Dual-mode scraping (tRPC + CDP browser), Telegram auto-alerts, Docker one-click deploy.'
          )}
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {features.map((feat, i) => (
          <motion.div key={feat.title} className="glass-card rounded-xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <feat.icon className={`w-5 h-5 ${feat.color} mb-2`} />
            <h3 className="text-[13px] font-semibold text-foreground mb-1">{feat.title}</h3>
            <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-secondary dark:bg-white/[0.03] border border-border w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
              activeTab === tab.id
                ? 'bg-background dark:bg-white/10 text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bot' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">open_claw_bot.py</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {t('可直接运行', 'Ready to run')}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(BOT_CODE, setCopiedBot)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all"
              >
                {copiedBot ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedBot ? t('已复制', 'Copied') : t('复制代码', 'Copy Code')}
              </button>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto bg-gray-50 dark:bg-black/30">
              <pre className="text-[11px] leading-relaxed text-foreground/70 font-mono whitespace-pre-wrap">{BOT_CODE}</pre>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'docker' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">docker-compose.yml</span>
              </div>
              <button
                onClick={() => copyToClipboard(DOCKER_CODE, setCopiedDocker)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all"
              >
                {copiedDocker ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedDocker ? t('已复制', 'Copied') : t('复制代码', 'Copy Code')}
              </button>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto bg-gray-50 dark:bg-black/30">
              <pre className="text-[11px] leading-relaxed text-foreground/70 font-mono whitespace-pre-wrap">{DOCKER_CODE}</pre>
            </div>
          </div>

          {/* Architecture diagram */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-foreground/70 mb-3">{t('系统架构', 'Architecture')}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { name: 'Chromium', desc: 'CDP :9222', color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
                { name: 'Scraper', desc: '15s interval', color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
                { name: 'TG Bot', desc: 'Auto alerts', color: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
              ].map(item => (
                <div key={item.name} className={`rounded-lg border p-3 ${item.color}`}>
                  <div className="text-xs font-semibold text-foreground">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>tRPC API (2-5s)</span>
              <span className="text-primary">→</span>
              <span>CDP Browser (10-15s)</span>
              <span className="text-primary">→</span>
              <span>JSON + Webhook</span>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'guide' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="space-y-2 mb-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="glass-card rounded-xl p-4 flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary">{step.num}</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-foreground mb-1">{step.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Links */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-foreground/70 mb-3">{t('相关链接', 'Resources')}</h3>
            <div className="space-y-2">
              {[
                { label: 'GitHub — OpenClaw Integration', url: 'https://github.com/Weioiiaoiia/Aocn-/tree/main/server/openclaw-integration' },
                { label: 'Telegram @BotFather', url: 'https://t.me/BotFather' },
                { label: 'Docker Desktop', url: 'https://www.docker.com/products/docker-desktop/' },
                { label: 'AOCN Dashboard', url: 'https://aocn-ten.vercel.app' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
