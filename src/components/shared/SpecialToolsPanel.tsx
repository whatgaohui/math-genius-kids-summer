'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Lock, Sparkles } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import type { Subject } from '@/lib/game-store';
import { getSpecialTools, getEnabledToolCount, getTotalToolCount } from '@/lib/special-tools';
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
    if (!tool.enabled) return;
    playClickSound();
    setCurrentView(tool.view);
  };

  return (
    <motion.button
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: tool.enabled ? 0.97 : 1 }}
      onClick={handleSelect}
      disabled={!tool.enabled}
      className={`w-full rounded-2xl p-3.5 shadow-sm transition-all text-left flex items-center gap-3 ${
        tool.enabled ? 'bg-white active:shadow-md' : 'bg-gray-50 cursor-not-allowed'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${tool.enabled ? '' : 'opacity-50'}`}
        style={{ backgroundColor: tool.bg }}
      >
        {tool.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className={`text-sm font-bold truncate ${tool.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
            {tool.name}
          </h4>
          {tool.badge && tool.enabled && (
            <span
              className="text-[8px] text-white rounded-full px-1.5 py-0.5 font-bold flex-shrink-0"
              style={{ backgroundColor: tool.color }}
            >
              {tool.badge}
            </span>
          )}
          {!tool.enabled && (
            <span className="text-[8px] bg-gray-200 text-gray-500 rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">
              即将上线
            </span>
          )}
        </div>
        <p className={`text-[11px] truncate ${tool.enabled ? 'text-gray-400' : 'text-gray-300'}`}>
          {tool.desc}
        </p>
      </div>
      <div className="flex-shrink-0">
        {tool.enabled ? (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${tool.color}15` }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: tool.color }} />
          </div>
        ) : (
          <Lock className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </motion.button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SpecialToolsPanel({ subject }: { subject: Subject }) {
  const groups = getSpecialTools(subject);
  const enabledCount = getEnabledToolCount(subject);
  const totalCount = getTotalToolCount(subject);

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
            针对性突破薄弱项 · {enabledCount}/{totalCount} 个工具已上线
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </motion.div>

      {/* Tool groups */}
      {groups.map((group) => (
        <div key={group.category}>
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="text-sm">{group.emoji}</span>
            <h3 className="text-xs font-bold text-gray-700">{group.category}</h3>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-gray-400">
              {group.tools.filter((t) => t.enabled).length}/{group.tools.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {group.tools.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        </div>
      ))}

      {/* Footer tip */}
      <div className="bg-gray-50 rounded-2xl p-3 flex items-start gap-2">
        <span className="text-sm">💡</span>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          专项训练工具会持续增加。每个工具都有独立的训练记录与进度，可根据孩子的薄弱项灵活选用。
        </p>
      </div>
    </div>
  );
}
