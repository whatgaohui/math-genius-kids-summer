'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Wrench } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import type { Subject } from '@/lib/game-store';
import { getSpecialTools, getEnabledToolCount } from '@/lib/special-tools';
import type { SpecialTool } from '@/lib/special-tools';
import { playClickSound } from '@/lib/sound';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── Tool Card ──────────────────────────────────────────────────────────────

function ToolCard({ tool, index }: { tool: SpecialTool; index: number }) {
  const setCurrentView = useGameStore((s) => s.setCurrentView);

  const handleSelect = () => {
    playClickSound();
    setCurrentView(tool.view);
  };

  return (
    <motion.button
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.97 }}
      onClick={handleSelect}
      className="w-full bg-white rounded-2xl p-3.5 shadow-sm active:shadow-md transition-all text-left flex items-center gap-3"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: tool.bg }}
      >
        {tool.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="text-sm font-bold text-gray-800 truncate">{tool.name}</h4>
          {tool.badge && (
            <span
              className="text-[8px] text-white rounded-full px-1.5 py-0.5 font-bold flex-shrink-0"
              style={{ backgroundColor: tool.color }}
            >
              {tool.badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate">{tool.desc}</p>
      </div>
      <div className="flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${tool.color}15` }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: tool.color }} />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ subject }: { subject: Subject }) {
  const subjectName = subject === 'math' ? '数学' : subject === 'chinese' ? '语文' : '英语';
  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
      <div className="text-5xl mb-3">🚧</div>
      <p className="text-sm font-bold text-gray-700 mb-1">{subjectName}专项训练敬请期待</p>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        专项训练工具正在开发中<br />目前可使用上方的自由练习、限时挑战、闯关模式
      </p>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SpecialToolsPanel({ subject }: { subject: Subject }) {
  const groups = getSpecialTools(subject);
  const totalCount = getEnabledToolCount(subject);

  // 无工具时显示空状态
  if (groups.length === 0 || totalCount === 0) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-3 flex items-center gap-3"
          style={{
            background: subject === 'math'
              ? 'linear-gradient(135deg, #FFF7ED, #FFFBEB)'
              : subject === 'chinese'
              ? 'linear-gradient(135deg, #FFF0F6, #FCE7F3)'
              : 'linear-gradient(135deg, #EFFEFA, #ECFDF5)',
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
            🧰
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-700">专项训练工具集</p>
            <p className="text-[10px] text-gray-500">针对性突破薄弱项 · 持续增加中</p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </motion.div>
        <EmptyState subject={subject} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-3 flex items-center gap-3"
        style={{
          background: subject === 'math'
            ? 'linear-gradient(135deg, #FFF7ED, #FFFBEB)'
            : subject === 'chinese'
            ? 'linear-gradient(135deg, #FFF0F6, #FCE7F3)'
            : 'linear-gradient(135deg, #EFFEFA, #ECFDF5)',
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
          🧰
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-700">专项训练工具集</p>
          <p className="text-[10px] text-gray-500">
            针对性突破薄弱项 · 共 {totalCount} 个工具
          </p>
        </div>
        <Wrench className="w-4 h-4 text-amber-500" />
      </motion.div>

      {/* Tool groups */}
      {groups.map((group) => (
        <div key={group.category}>
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="text-sm">{group.emoji}</span>
            <h3 className="text-xs font-bold text-gray-700">{group.category}</h3>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-gray-400">{group.tools.length} 个</span>
          </div>
          <div className="space-y-2.5">
            {group.tools.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
