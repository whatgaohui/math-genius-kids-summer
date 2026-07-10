'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, Flame, Lightbulb, Star,
  Target, TrendingUp, Trophy, Zap, FileBarChart, AlertCircle,
} from 'lucide-react';
import { useSummerCampStore, getCompletedDayCount, getTotalAccuracy, getStreakDays, getTotalQuestions } from '@/lib/summer-camp-store';
import { DAYS, PHASES, getDayPlan, getPhaseInfo, TOTAL_DAYS } from '@/lib/summer-camp/plan';
import { useGameStore } from '@/lib/game-store';
import { formatTimeChinese } from '@/lib/math-utils';
import { playClickSound } from '@/lib/sound';
import BottomNav from './BottomNav';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function SummerCampReport() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const [selectedWeek, setSelectedWeek] = useState(1);

  const completedCount = getCompletedDayCount(camp);
  const totalAccuracy = getTotalAccuracy(camp);
  const streak = getStreakDays(camp);
  const totalQuestions = getTotalQuestions(camp);

  // 计算周次数据（每7天一周，共9周）
  const weeks = useMemo(() => {
    const result: { week: number; days: number[]; label: string }[] = [];
    for (let w = 1; w <= 9; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = Math.min(w * 7, TOTAL_DAYS);
      const days: number[] = [];
      for (let d = startDay; d <= endDay; d++) days.push(d);
      result.push({ week: w, days, label: `第${w}周` });
    }
    return result;
  }, []);

  const currentWeekNum = Math.min(9, Math.floor(completedCount / 7) + 1);

  // 当前选中周的数据
  const weekData = useMemo(() => {
    const wk = weeks.find((w) => w.week === selectedWeek) || weeks[0];
    const records = wk.days.map((d) => camp.completedDays[d]).filter((r) => r && r.completed);
    const dayCount = records.length;
    const totalCorrect = records.reduce((s, r) => s + r.baseCorrect + r.speedCorrect, 0);
    const totalQ = records.reduce((s, r) => s + r.baseTotal + r.speedTotal, 0);
    const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
    const totalTime = records.reduce((s, r) => s + r.baseTimeMs + r.speedTimeMs, 0);
    const avgTimePerQ = totalQ > 0 ? Math.round(totalTime / totalQ) : 0;

    // 按运算类型统计正确率（基于题目表达式解析，这里简化用 focus 推断）
    // 因 DayRecord 未存运算细节，按阶段推断
    const byFocusType: Record<string, { correct: number; total: number }> = {};
    for (const r of records) {
      const plan = getDayPlan(r.day);
      if (!plan) continue;
      const key = plan.focus;
      if (!byFocusType[key]) byFocusType[key] = { correct: 0, total: 0 };
      byFocusType[key].correct += r.baseCorrect + r.speedCorrect;
      byFocusType[key].total += r.baseTotal + r.speedTotal;
    }

    // 速度趋势（按天）
    const dailyTrend = records.map((r) => ({
      day: r.day,
      accuracy: r.accuracy,
      avgTime: r.avgTimeMs,
    }));

    return { dayCount, totalCorrect, totalQ, accuracy, totalTime, avgTimePerQ, byFocusType, dailyTrend, records };
  }, [selectedWeek, weeks, camp.completedDays]);

  // 薄弱项
  const focusEntries = Object.entries(weekData.byFocusType);
  const weakestFocus = focusEntries.length > 0
    ? [...focusEntries].sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0]
    : null;

  const FOCUS_LABELS: Record<string, string> = {
    'add-10': '10以内加法', 'sub-10': '10以内减法',
    'add-carry-9': '9+几进位加', 'add-carry-8': '8/7+几进位加', 'add-carry-20': '20以内进位加',
    'sub-borrow-20': '20以内退位减', 'mix-20': '20以内混合', 'mix-20-speed': '20以内提速',
    'add-100-no-carry': '100不进位加', 'sub-100-no-borrow': '100不退位减',
    'add-100-carry': '100进位加', 'sub-100-borrow': '100退位减',
    'mix-100': '100以内混合', 'mix-100-speed': '100以内提速',
    'error-review': '错题复习', 'final-test': '综合测评',
  };

  // 建议
  const suggestions: string[] = [];
  if (weekData.dayCount === 0) {
    suggestions.push('本周还未开始训练，建议尽快开始每日训练');
  } else {
    if (weekData.accuracy < 70) suggestions.push('正确率偏低，建议放慢速度，先保证做对再提速');
    else if (weekData.accuracy >= 90) suggestions.push('正确率优秀，可适当增加挑战难度');
    if (weekData.avgTimePerQ > 8000) suggestions.push('计算速度偏慢，多练限时挑战');
    if (weakestFocus) {
      const label = FOCUS_LABELS[weakestFocus[0]] || weakestFocus[0];
      suggestions.push(`薄弱项：${label}，建议针对性复习`);
    }
    if (weekData.dayCount < 5) suggestions.push(`本周仅训练 ${weekData.dayCount} 天，建议保持每天训练`);
    else suggestions.push('训练坚持度好，保持节奏');
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] pb-16 pt-5 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
        <div className="mx-auto max-w-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { playClickSound(); setCurrentView('summer-camp'); }}
              className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2 active:scale-95 transition-transform min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 返回
            </button>
            <span className="text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2">
              📊 家长周报
            </span>
          </div>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-white text-xl font-black mb-1">{camp.childName} 的训练报告</h1>
            <p className="text-white/70 text-xs mb-4">{camp.childGrade} · 暑期数学突击训练营</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: CheckCircle2, label: '已完成', value: `${completedCount}天` },
                { icon: TrendingUp, label: '正确率', value: `${totalAccuracy}%` },
                { icon: Flame, label: '连续', value: `${streak}天` },
                { icon: Zap, label: '总题量', value: `${totalQuestions}` },
              ].map((s) => (
                <div key={s.label} className="bg-white/15 backdrop-blur-md rounded-2xl py-2.5 px-1 text-center">
                  <s.icon className="w-3.5 h-3.5 mx-auto mb-1 text-white/80" />
                  <p className="text-white text-sm font-black">{s.value}</p>
                  <p className="text-white/60 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-10 relative z-20 pb-28">
        {/* Week selector */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-4 shadow-xl mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B5CF6]" /> 选择周次
          </h3>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {weeks.map((w) => {
              const hasData = w.days.some((d) => camp.completedDays[d]?.completed);
              const isCurrent = w.week === currentWeekNum;
              return (
                <button
                  key={w.week}
                  onClick={() => { playClickSound(); setSelectedWeek(w.week); }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedWeek === w.week ? 'bg-[#8B5CF6] text-white shadow-md' : isCurrent ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  第{w.week}周
                  {hasData && <span className="ml-1">●</span>}
                </button>
              );
            })}
          </div>
        </motion.div>

        {weekData.dayCount === 0 ? (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-sm font-bold text-gray-700 mb-1">本周暂无训练记录</p>
            <p className="text-xs text-gray-400">选择有训练记录的周次查看报告</p>
          </motion.div>
        ) : (
          <>
            {/* Week summary */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">第{selectedWeek}周汇总</h3>
                <span className="text-[10px] bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full px-2 py-0.5 font-bold">
                  {weekData.dayCount} 天训练
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#10B981]/8 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[10px] text-gray-400">正确率</span>
                  </div>
                  <p className="text-2xl font-black text-[#10B981]">{weekData.accuracy}%</p>
                  <p className="text-[9px] text-gray-400">{weekData.totalCorrect}/{weekData.totalQ} 题</p>
                </div>
                <div className="bg-[#F59E0B]/8 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span className="text-[10px] text-gray-400">总用时</span>
                  </div>
                  <p className="text-2xl font-black text-[#F59E0B]">{formatTimeChinese(weekData.totalTime)}</p>
                  <p className="text-[9px] text-gray-400">均速 {Math.round(weekData.avgTimePerQ / 1000)}s/题</p>
                </div>
              </div>
            </motion.div>

            {/* Daily trend */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8B5CF6]" /> 每日正确率趋势
              </h3>
              <div className="flex items-end justify-between gap-1.5 h-32 mb-2">
                {weekData.dailyTrend.map((d) => {
                  const height = Math.max(8, d.accuracy);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end">
                      <span className="text-[9px] font-bold text-gray-500 mb-1">{d.accuracy}%</span>
                      <motion.div
                        className="w-full rounded-t-lg"
                        style={{ backgroundColor: d.accuracy >= 90 ? '#10B981' : d.accuracy >= 75 ? '#F59E0B' : '#EF4444' }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      <span className="text-[8px] text-gray-400 mt-1">D{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> ≥90%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> 75-89%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> &lt;75%</span>
              </div>
            </motion.div>

            {/* Type breakdown */}
            {focusEntries.length > 0 && (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm mb-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FileBarChart className="w-4 h-4 text-[#8B5CF6]" /> 题型掌握度
                </h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {[...focusEntries]
                    .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
                    .map(([focus, stats]) => {
                      const pct = Math.round((stats.correct / stats.total) * 100);
                      const label = FOCUS_LABELS[focus] || focus;
                      return (
                        <div key={focus}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-medium text-gray-600">{label}</span>
                            <span className="font-bold" style={{ color: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444' }}>
                              {pct}% ({stats.correct}/{stats.total})
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#F59E0B]" /> 家长建议
              </h3>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-xl p-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Daily detail list */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8B5CF6]" /> 每日明细
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {weekData.records.map((r) => {
                  const plan = getDayPlan(r.day);
                  const phaseInfo = plan ? getPhaseInfo(plan.phase) : null;
                  return (
                    <div key={r.day} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: phaseInfo ? `${phaseInfo.color}15` : '#f3f4f6' }}>
                        {plan?.emoji || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">Day{r.day} · {plan?.title}</p>
                        <p className="text-[10px] text-gray-400">{r.baseTotal + r.speedTotal}题 · {formatTimeChinese(r.baseTimeMs + r.speedTimeMs)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color: r.accuracy >= 90 ? '#10B981' : r.accuracy >= 75 ? '#F59E0B' : '#EF4444' }}>{r.accuracy}%</p>
                        <div className="flex items-center justify-end gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star key={s} className={`w-2.5 h-2.5 ${s <= r.stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* Diagnostic comparison (always show if pre done) */}
        {camp.diagnosticPre && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-sm mt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" /> 能力诊断对比
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">入营诊断</p>
                <p className="text-2xl font-black text-gray-600">{camp.diagnosticPre.accuracy}%</p>
                <p className="text-[9px] text-gray-400">{Math.round(camp.diagnosticPre.avgTimeMs / 1000)}s/题</p>
              </div>
              <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#EF4444]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">{camp.diagnosticPost ? '结营测评' : '待测'}</p>
                <p className="text-2xl font-black" style={{ color: camp.diagnosticPost ? '#EF4444' : '#d1d5db' }}>
                  {camp.diagnosticPost ? `${camp.diagnosticPost.accuracy}%` : '—'}
                </p>
                <p className="text-[9px] font-medium text-[#10B981]">
                  {camp.diagnosticPost ? `+${Math.max(0, camp.diagnosticPost.accuracy - camp.diagnosticPre.accuracy)}% 提升` : '完成60天后测'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
