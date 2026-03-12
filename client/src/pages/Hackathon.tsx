/*
 * Design: Obsidian Glass — Hackathon Hub (Coming Soon)
 * 技术栈预览 + 执行路线图
 */
import { useLang } from '@/contexts/LanguageContext';
import { Clock, Code2, Cpu, Globe, Layers, Rocket, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hackathon() {
  const { t } = useLang();

  const techStack = [
    { icon: Cpu, label: 'AI', desc: t('Auranaiss Intelligence 开源 Skills + CLI (Python Agents)', 'Auranaiss Intelligence Open-source Skills + CLI (Python Agents)') },
    { icon: Code2, label: t('合约', 'Contracts'), desc: t('Solidity + Hardhat (Renaiss SDK, ERC-721/SBT/桥接)', 'Solidity + Hardhat (Renaiss SDK, ERC-721/SBT/Bridge)') },
    { icon: Globe, label: t('前端', 'Frontend'), desc: t('Next.js + Tailwind (移动扫描卡片)', 'Next.js + Tailwind (Mobile Card Scanning)') },
    { icon: Layers, label: t('后端', 'Backend'), desc: t('Node.js + WebSocket (实时 CLI 监控)', 'Node.js + WebSocket (Real-time CLI Monitoring)') },
  ];

  const phases = [
    { num: '01', title: t('预备阶段', 'Preparation'), desc: t('Setup 真实 Renaiss SDK/CLI，测试 Discord 工具', 'Setup real Renaiss SDK/CLI, test Discord tools'), status: 'upcoming' },
    { num: '02', title: t('Hack 期', 'Hack Period'), desc: t('建 AI Swarm，集成市场/Gacha 数据', 'Build AI Swarm, integrate Market/Gacha data'), status: 'upcoming' },
    { num: '03', title: t('Demo 展示', 'Demo'), desc: t('展示真实查询 (e.g., Renacrypt Pack 分析)，量化 $4M 基数提升', 'Showcase real queries (e.g., Renacrypt Pack analysis), quantify $4M base improvement'), status: 'upcoming' },
    { num: '04', title: t('Pitch 路演', 'Pitch'), desc: t('Slides 引用 Renaiss roadmap 和 220k 用户数据', 'Slides referencing Renaiss roadmap and 220k user data'), status: 'upcoming' },
  ];

  return (
    <div>
      {/* Coming Soon Hero */}
      <motion.div
        className="glass-card rounded-2xl p-8 lg:p-12 text-center mb-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-purple-500/[0.03]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[12px] font-medium text-emerald-400">COMING SOON</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white/90 mb-3">
            {t('黑客松中心', 'Hackathon Hub')}
          </h1>
          <p className="text-sm text-white/40 max-w-lg mx-auto mb-6">
            {t(
              'Renaiss 官方黑客松内容即将公布。我们已准备好完整的技术栈和执行计划，等待官方发令枪响。',
              'Renaiss official hackathon details coming soon. We have a complete tech stack and execution plan ready, waiting for the official go signal.'
            )}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-amber-400/60" />
            <span className="text-[13px] text-white/50">{t('预计时间: 2026年4月', 'Expected: April 2026')}</span>
          </div>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400/60" />
          {t('技术栈预览', 'Tech Stack Preview')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techStack.map((tech, i) => (
            <motion.div
              key={tech.label}
              className="glass-card rounded-xl p-4 flex items-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <tech.icon className="w-4 h-4 text-emerald-400/60" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-white/70 mb-0.5">{tech.label}</h3>
                <p className="text-[11px] text-white/35">{tech.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Execution Roadmap */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-emerald-400/60" />
          {t('执行路线图', 'Execution Roadmap')}
        </h2>
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.06]" />
          <div className="space-y-3">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.num}
                className="relative pl-12"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="absolute left-2.5 top-4 w-4 h-4 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400/50">PHASE {phase.num}</span>
                  </div>
                  <h3 className="text-sm font-medium text-white/70 mb-1">{phase.title}</h3>
                  <p className="text-[11px] text-white/35">{phase.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
