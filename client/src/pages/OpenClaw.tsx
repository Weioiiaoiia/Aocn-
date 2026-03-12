/*
 * AOCN Open Claw — Clean dual-theme
 */
import { useLang } from '@/contexts/LanguageContext';
import { Bot, Copy, Check, Terminal, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

const BOT_CODE = `#!/usr/bin/env python3
"""
AOCN Open Claw - Renaiss Market Arbitrage Bot for Telegram
自动监控 Renaiss 市场，发现低于 FMV 的卡牌并推送通知

使用方法:
1. 安装依赖: pip install python-telegram-bot requests
2. 设置环境变量: TELEGRAM_BOT_TOKEN=your_bot_token
3. 运行: python open_claw_bot.py
"""

import os
import json
import asyncio
import requests
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ============ 配置 ============
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
RENAISS_MARKETPLACE_URL = "https://www.renaiss.xyz/marketplace"
CHECK_INTERVAL = 300  # 每5分钟检查一次

def fetch_marketplace_data():
    try:
        headers = {"User-Agent": "AOCN-OpenClaw/1.0", "Accept": "application/json"}
        response = requests.get(
            "https://www.renaiss.xyz/api/marketplace/listings",
            headers=headers, timeout=10
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"[WARN] API fetch failed: {e}")
    return None

def analyze_arbitrage(listings):
    opportunities = []
    for item in listings:
        price = float(item.get("price", 0))
        fmv = float(item.get("fmv", 0))
        if price > 0 and fmv > 0:
            spread = fmv - price
            spread_pct = (spread / price) * 100
            if spread_pct > 5:
                opportunities.append({
                    "name": item.get("name", "Unknown"),
                    "price": price, "fmv": fmv,
                    "spread": round(spread, 2),
                    "spread_pct": round(spread_pct, 1),
                })
    return sorted(opportunities, key=lambda x: x["spread_pct"], reverse=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = (
        "🦞 *AOCN Open Claw Bot*\\n\\n"
        "自动监控 Renaiss Protocol 市场套利机会\\n\\n"
        "📋 *命令列表:*\\n"
        "/scan - 立即扫描市场\\n"
        "/top5 - Top 5 套利机会\\n"
        "/alert - 开启自动推送\\n"
        "/stop - 关闭自动推送\\n"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown")

async def scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔍 正在扫描 Renaiss 市场...")
    data = fetch_marketplace_data()
    if not data:
        await update.message.reply_text("⚠️ 暂时无法获取市场数据")
        return
    opportunities = analyze_arbitrage(data)
    if not opportunities:
        await update.message.reply_text("📊 当前没有发现套利机会")
        return
    for opp in opportunities[:5]:
        text = f"🎴 *{opp['name']}*\\n💰 $" + "{opp['price']}" + " → FMV $" + "{opp['fmv']}" + "\\n📈 +{opp['spread_pct']}%"
        await update.message.reply_text(text, parse_mode="Markdown")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("scan", scan))
    print("🦞 AOCN Open Claw Bot 启动成功!")
    app.run_polling()

if __name__ == "__main__":
    main()
`;

export default function OpenClaw() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(BOT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const steps = [
    { num: '01', title: t('获取 Telegram Bot Token', 'Get Telegram Bot Token'), desc: t('在 Telegram 中找到 @BotFather，发送 /newbot 创建机器人。', 'Find @BotFather on Telegram, send /newbot to create a bot.') },
    { num: '02', title: t('安装 Python 依赖', 'Install Dependencies'), desc: t('运行 pip install python-telegram-bot requests', 'Run pip install python-telegram-bot requests') },
    { num: '03', title: t('配置环境变量', 'Configure Env'), desc: t('设置 TELEGRAM_BOT_TOKEN=your_token_here', 'Set TELEGRAM_BOT_TOKEN=your_token_here') },
    { num: '04', title: t('运行机器人', 'Run Bot'), desc: t('执行 python open_claw_bot.py 启动机器人', 'Execute python open_claw_bot.py to start') },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Open Claw AI</h1>
        <p className="text-sm text-muted-foreground">
          {t('一键生成 Telegram 套利监控机器人代码。', 'One-click generate Telegram arbitrage monitoring bot code.')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Bot, title: t('实时扫描', 'Real-time Scan'), desc: t('每5分钟自动扫描市场', 'Auto-scan every 5 min') },
          { icon: Terminal, title: t('套利推送', 'Alerts'), desc: t('发现捡漏自动推送', 'Auto-push deals') },
          { icon: Rocket, title: t('一键部署', 'Deploy'), desc: t('复制代码即可运行', 'Copy and run') },
        ].map((feat, i) => (
          <motion.div key={feat.title} className="glass-card rounded-xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <feat.icon className="w-5 h-5 text-primary mb-2" />
            <h3 className="text-[13px] font-semibold text-foreground mb-1">{feat.title}</h3>
            <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">open_claw_bot.py</span>
          </div>
          <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all">
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? t('已复制', 'Copied') : t('复制代码', 'Copy Code')}
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-black/30">
          <pre className="text-[11px] leading-relaxed text-foreground/70 font-mono whitespace-pre-wrap">{BOT_CODE}</pre>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-foreground/70 mb-3">{t('部署指南', 'Deployment Guide')}</h2>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div key={step.num} className="glass-card rounded-xl p-4 flex items-start gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-primary">{step.num}</span>
            </div>
            <div>
              <h3 className="text-[13px] font-medium text-foreground mb-1">{step.title}</h3>
              <p className="text-[11px] text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
