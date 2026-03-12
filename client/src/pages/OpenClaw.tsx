/*
 * Design: AOCN Open Claw — Ice Blue + Violet
 * TG Bot一键代码生成 + 部署指南
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

# ============ Renaiss 市场数据获取 ============
def fetch_marketplace_data():
    """
    从 Renaiss 市场获取当前挂牌卡牌数据
    注意: 这里使用的是公开可访问的市场数据
    实际部署时可替换为 Renaiss 官方 API
    """
    # 示例: 通过页面数据获取市场信息
    # 在实际部署中，建议使用 Renaiss 提供的 API endpoints
    try:
        headers = {
            "User-Agent": "AOCN-OpenClaw/1.0",
            "Accept": "application/json"
        }
        # Renaiss marketplace API endpoint
        response = requests.get(
            "https://www.renaiss.xyz/api/marketplace/listings",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"[WARN] API fetch failed: {e}")
    return None

def analyze_arbitrage(listings):
    """分析套利机会"""
    opportunities = []
    for item in listings:
        price = float(item.get("price", 0))
        fmv = float(item.get("fmv", 0))
        if price > 0 and fmv > 0:
            spread = fmv - price
            spread_pct = (spread / price) * 100
            if spread_pct > 5:  # 只推送价差 > 5% 的机会
                opportunities.append({
                    "name": item.get("name", "Unknown"),
                    "price": price,
                    "fmv": fmv,
                    "spread": round(spread, 2),
                    "spread_pct": round(spread_pct, 1),
                    "image": item.get("image", ""),
                    "ebay_url": build_ebay_url(item.get("name", "")),
                })
    return sorted(opportunities, key=lambda x: x["spread_pct"], reverse=True)

def build_ebay_url(name):
    """构建 eBay 精确搜索链接"""
    import urllib.parse
    search = name.replace("Gem Mint", "").replace("NM-MT", "").replace("Mint", "").strip()
    return f"https://www.ebay.com/sch/i.html?_nkw={urllib.parse.quote(search)}&_sacat=0&LH_TitleDesc=0&_sop=12"

# ============ Telegram Bot 命令 ============
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """启动命令"""
    welcome = (
        "🦞 *AOCN Open Claw Bot*\\n\\n"
        "自动监控 Renaiss Protocol 市场套利机会\\n\\n"
        "📋 *命令列表:*\\n"
        "/scan - 立即扫描市场捡漏\\n"
        "/top5 - 查看 Top 5 套利机会\\n"
        "/alert - 开启自动推送\\n"
        "/stop - 关闭自动推送\\n"
        "/stats - 市场统计数据\\n\\n"
        "💡 数据来源: Renaiss Protocol 官方市场"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown")

async def scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """扫描市场"""
    await update.message.reply_text("🔍 正在扫描 Renaiss 市场...")
    
    data = fetch_marketplace_data()
    if not data:
        await update.message.reply_text("⚠️ 暂时无法获取市场数据，请稍后重试")
        return
    
    opportunities = analyze_arbitrage(data)
    if not opportunities:
        await update.message.reply_text("📊 当前没有发现明显的套利机会 (价差 > 5%)")
        return
    
    for opp in opportunities[:5]:
        text = (
            f"🎴 *{opp['name']}*\\n\\n"
            f"💰 挂牌价: $" + str(opp['price']) + "\\n"
            f"📊 FMV: $" + str(opp['fmv']) + "\\n"
            f"📈 套利空间: +$" + str(opp['spread']) + " (" + str(opp['spread_pct']) + "%)\\n"
        )
        keyboard = [[
            InlineKeyboardButton("🔗 Renaiss", url=RENAISS_MARKETPLACE_URL),
            InlineKeyboardButton("🔍 eBay", url=opp["ebay_url"]),
        ]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=reply_markup)

async def top5(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Top 5 套利机会"""
    await scan(update, context)

async def alert_on(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """开启自动推送"""
    chat_id = update.effective_chat.id
    context.job_queue.run_repeating(
        auto_scan, interval=CHECK_INTERVAL, first=10,
        chat_id=chat_id, name=str(chat_id)
    )
    await update.message.reply_text(f"✅ 自动推送已开启，每 {CHECK_INTERVAL//60} 分钟扫描一次")

async def alert_off(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """关闭自动推送"""
    chat_id = str(update.effective_chat.id)
    jobs = context.job_queue.get_jobs_by_name(chat_id)
    for job in jobs:
        job.schedule_removal()
    await update.message.reply_text("🔕 自动推送已关闭")

async def auto_scan(context: ContextTypes.DEFAULT_TYPE):
    """自动扫描任务"""
    data = fetch_marketplace_data()
    if not data:
        return
    opportunities = analyze_arbitrage(data)
    if opportunities:
        text = f"🚨 *发现 {len(opportunities)} 个套利机会!*\\n\\n"
        for opp in opportunities[:3]:
            text += f"• {opp['name']}: +{opp['spread_pct']}%\\n"
        text += f"\\n使用 /scan 查看详情"
        await context.bot.send_message(
            chat_id=context.job.chat_id,
            text=text, parse_mode="Markdown"
        )

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """市场统计"""
    text = (
        "📊 *Renaiss 市场统计*\\n\\n"
        "👥 总用户: 220,000+\\n"
        "💰 总交易量: $4,000,000+\\n"
        "🎴 链上藏品: 3,500+\\n"
        "🤝 合作伙伴: 15+\\n\\n"
        f"⏰ 更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

# ============ 启动 ============
def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("scan", scan))
    app.add_handler(CommandHandler("top5", top5))
    app.add_handler(CommandHandler("alert", alert_on))
    app.add_handler(CommandHandler("stop", alert_off))
    app.add_handler(CommandHandler("stats", stats))
    
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
    { num: '01', title: t('获取 Telegram Bot Token', 'Get Telegram Bot Token'), desc: t('在 Telegram 中找到 @BotFather，发送 /newbot 创建机器人并获取 Token。', 'Find @BotFather on Telegram, send /newbot to create a bot and get the Token.') },
    { num: '02', title: t('安装 Python 依赖', 'Install Python Dependencies'), desc: t('运行 pip install python-telegram-bot requests 安装所需依赖。', 'Run pip install python-telegram-bot requests to install dependencies.') },
    { num: '03', title: t('配置环境变量', 'Configure Environment Variables'), desc: t('设置 TELEGRAM_BOT_TOKEN=your_token_here 环境变量。', 'Set TELEGRAM_BOT_TOKEN=your_token_here environment variable.') },
    { num: '04', title: t('运行机器人', 'Run the Bot'), desc: t('执行 python open_claw_bot.py 启动机器人，在 Telegram 中发送 /start 开始使用。', 'Execute python open_claw_bot.py to start the bot, send /start in Telegram to begin.') },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90 mb-2">Open Claw AI</h1>
        <p className="text-sm text-white/40">
          {t(
            '一键生成 Telegram 套利监控机器人代码。在你自己的 TG Bot 中实时查询 Renaiss 市场捡漏机会。',
            'One-click generate Telegram arbitrage monitoring bot code. Query Renaiss market opportunities in real-time through your own TG Bot.'
          )}
        </p>
      </div>

      {/* Feature overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Bot, title: t('实时扫描', 'Real-time Scan'), desc: t('每5分钟自动扫描市场', 'Auto-scan market every 5 min') },
          { icon: Terminal, title: t('套利推送', 'Arbitrage Alerts'), desc: t('发现捡漏自动推送通知', 'Auto-push when deals found') },
          { icon: Rocket, title: t('一键部署', 'One-click Deploy'), desc: t('复制代码即可运行', 'Copy code and run') },
        ].map((feat, i) => (
          <motion.div
            key={feat.title}
            className="glass-card rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <feat.icon className="w-5 h-5 text-ice-dim mb-2" />
            <h3 className="text-[13px] font-semibold text-white/70 mb-1">{feat.title}</h3>
            <p className="text-[11px] text-white/35">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Code block */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-ice-dim" />
            <span className="text-[12px] text-white/50">open_claw_bot.py</span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] bg-white/[0.05] text-white/50 hover:text-white/70 hover:bg-white/[0.08] transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-ice" /> : <Copy className="w-3 h-3" />}
            {copied ? t('已复制', 'Copied') : t('复制代码', 'Copy Code')}
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <pre className="text-[11px] leading-relaxed text-white/50 font-mono whitespace-pre-wrap">
            {BOT_CODE}
          </pre>
        </div>
      </div>

      {/* Deployment steps */}
      <h2 className="text-sm font-semibold text-white/60 mb-3">{t('部署指南', 'Deployment Guide')}</h2>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            className="glass-card rounded-xl p-4 flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="w-8 h-8 rounded-lg bg-ice/10 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-ice">{step.num}</span>
            </div>
            <div>
              <h3 className="text-[13px] font-medium text-white/70 mb-1">{step.title}</h3>
              <p className="text-[11px] text-white/35">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
