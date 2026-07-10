'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, Clock, Flame, Play, Sparkles, Star, Target,
  TrendingUp, Zap, Award, CheckCircle2, BarChart3,
} from 'lucide-react';
import { useSummerCampStore } from '@/lib/summer-camp-store';
import type { TopicStats } from '@/lib/summer-camp-store';
import { useGameStore } from '@/lib/game-store';
import { FREE_CATEGORIES, type FreeTopic } from '@/lib/summer-camp/plan';
import { playClickSound } from '@/lib/sound';
import BottomNav from './BottomNav';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function getStarsFromAccuracy(acc: number): number {
  if (acc >= 90) return 3;
  if (acc >= 75) return 2;
  if (acc >= 60) return 1;
  return 0;
}

// ─── Topic Card ─────────────────────────────────────────────────────────────

function TopicCard({ topic, stats, color, bg, onSelect }: {
  topic: FreeTopic;
  stats?: TopicStats;
  color: string;
  bg: string;
  onSelect: (t: FreeTopic) => void;
}) {
  const stars = stats ? getStarsFromAccuracy(stats.bestAccuracy) : 0;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { playClickSound(); onSelect(topic); }}
      className="w-full bg-white rounded-2xl p-3.5 shadow-sm active:shadow-md transition-all text-left flex items-center gap-3"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: bg }}>
        {topic.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-bold text-gray-800 truncate">{topic.name}</h4>
          {stats && stats.attempts > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {[1, 2, 3].map((s) => (
                <Star key={s} className={`w-2.5 h-2.5 ${s <= stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-200'}`} />
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{topic.desc}</p>
        {stats && stats.attempts > 0 ? (
          <div className="flex items-center gap-2 mt-1 text-[9px]">
            <span className="font-bold" style={{ color: stats.bestAccuracy >= 90 ? '#10B981' : stats.bestAccuracy >= 75 ? '#F59E0B' : '#EF4444' }}>
              最佳 {stats.bestAccuracy}%
            </span>
            <span className="text-gray-400">练 {stats.attempts} 次</span>
            {stats.bestAvgTimeMs > 0 && (
              <span className="text-gray-400 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                {Math.round(stats.bestAvgTimeMs / 1000)}s/题
              </span>
            )}
          </div>
        ) : (
          <p className="text-[9px] text-gray-300 mt-1">未练习</p>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Play className="w-3 h-3 fill-current" style={{ color }} />
        </div>
        <span className="text-[8px] text-gray-400 mt-0.5">{topic.count + topic.speedCount}题</span>
      </div>
    </motion.button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SummerCampFree() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const [activeCat, setActiveCat] = useState<string>('add100'); // 默认显示100以内加法（用户的重点需求）

  // 总自由训练统计
  const totalAttempts = camp.freePracticeHistory.length;
  const totalCorrect = camp.freePracticeHistory.reduce((s, r) => s + r.baseCorrect + r.speedCorrect, 0);
  const totalQuestions = camp.freePracticeHistory.reduce((s, r) => s + r.baseTotal + r.speedTotal, 0);
  const overallAcc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const practicedTopics = Object.keys(camp.topicStats).filter((k) => camp.topicStats[k].attempts > 0).length;

  const currentCat = FREE_CATEGORIES.find((c) => c.key === activeCat) || FREE_CATEGORIES[0];

  const onSelectTopic = (topic: FreeTopic) => {
    // 通过 sessionStorage 传递选题，daily 页会读取
    try {
      sessionStorage.setItem('summer-free-topic', JSON.stringify(topic));
    } catch { /* ignore */ }
    setCurrentView('summer-daily');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#06B6D4] via-[#0EA5E9] to-[#6366F1] pb-16 pt-5 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3" />
        <div className="mx-auto max-w-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { playClickSound(); setCurrentView('summer-camp'); }}
              className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2 active:scale-95 transition-transform min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 返回
            </button>
            <span className="text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2">
              🎯 自由训练
            </span>
          </div>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-white text-xl font-black mb-1">想练什么，直接选</h1>
            <p className="text-white/70 text-xs mb-4">不按计划走，自由突击薄弱项</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Target, label: '已练题型', value: `${practicedTopics}/${FREE_CATEGORIES.flatMap(c=>c.topics).length}` },
                { icon: Flame, label: '训练次数', value: `${totalAttempts}` },
                { icon: TrendingUp, label: '正确率', value: `${overallAcc}%` },
                { icon: BarChart3, label: '总题数', value: `${totalQuestions}` },
              ].map((s) => (
                <div key={s.label} className="bg-white/15 backdrop-blur-md rounded-2xl py-2.5 px-1 text-center">
                  <s.icon className="w-3.5 h-3.5 mx-auto mb-1 text-white/80" />
                  <p className="text-white text-xs font-black">{s.value}</p>
                  <p className="text-white/60 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ Category Tabs ═══ */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 -mt-10 relative z-20 mb-4">
        <div className="bg-white rounded-3xl p-3 shadow-xl">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FREE_CATEGORIES.map((c) => {
              const isActive = activeCat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => { playClickSound(); setActiveCat(c.key); }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isActive ? 'text-white shadow-md' : 'bg-gray-50 text-gray-500'
                  }`}
                  style={isActive ? { backgroundColor: c.color } : {}}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ═══ Topics ═══ */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span>{currentCat.emoji}</span> {currentCat.label}
          </h2>
          <span className="text-[10px] text-gray-400">{currentCat.topics.length} 个题型</span>
        </div>
        <div className="space-y-2.5">
          {currentCat.topics.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <TopicCard
                topic={topic}
                stats={camp.topicStats[topic.id]}
                color={currentCat.color}
                bg={currentCat.bg}
                onSelect={onSelectTopic}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Tip ═══ */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 pb-28">
        <div className="bg-cyan-50 rounded-2xl p-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-cyan-700 leading-relaxed">
            <p className="font-bold mb-0.5">💡 自由训练说明</p>
            <p>• 每个题型含「基础练习 + 限时挑战」两阶段</p>
            <p>• 练习记录会自动累计，可看到最佳成绩与练习次数</p>
            <p>• 做错的题自动进错题本，可在「错题复习」题型重练</p>
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
