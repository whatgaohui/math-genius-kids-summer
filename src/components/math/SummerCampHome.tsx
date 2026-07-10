'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, CheckCircle2, ChevronRight, Flame, Lightbulb,
  Play, Sparkles, Star, Target, TrendingUp, Trophy, Zap,
  GraduationCap, Award, BookOpen, FileBarChart, Rocket, Leaf,
} from 'lucide-react';
import { useSummerCampStore, getCompletedDayCount, getTotalAccuracy, getStreakDays } from '@/lib/summer-camp-store';
import { DAYS, PHASES, TOTAL_DAYS, getDayPlan, getCurrentDay, getPhaseInfo, getTotalQuestions } from '@/lib/summer-camp/plan';
import { playClickSound } from '@/lib/sound';
import { useGameStore } from '@/lib/game-store';
import BottomNav from './BottomNav';

// ─── Animation ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── Enrollment Card ────────────────────────────────────────────────────────

function EnrollmentCard() {
  const enroll = useSummerCampStore((s) => s.enroll);
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('三年级');

  const handleEnroll = () => {
    playClickSound();
    enroll(name.trim() || '小朋友', grade);
    setTimeout(() => setCurrentView('summer-diagnostic'), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7ED] via-[#FFFBEB] to-[#ECFDF5]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#F59E0B] via-[#EF4444] to-[#8B5CF6] px-5 pt-10 pb-20">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-md mx-auto text-center">
          <motion.div
            className="text-6xl mb-3"
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >🏰</motion.div>
          <h1 className="text-2xl font-black text-white mb-2">暑期数学突击训练营</h1>
          <p className="text-white/80 text-sm">60 天 · 20/100 以内加减法 · 系统突击</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['🌱基础巩固', '⚡提速突破', '🚀百内攻坚', '🏆综合冲刺'].map((t, i) => (
              <span key={i} className="text-[10px] bg-white/20 backdrop-blur rounded-full px-2 py-1 text-white font-medium">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5 -mt-12 relative z-20 pb-28">
        {/* Why */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-xl shadow-orange-200/40 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#F59E0B]" /> 为什么是 60 天突击？
          </h2>
          <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
            <p>📚 <b>三年级数学分水岭</b>：计算速度跟不上，应用题、多位数乘除全受阻</p>
            <p>🎯 <b>精准突击</b>：每天 15-20 分钟，专攻 20/100 以内加减法</p>
            <p>🧠 <b>方法先行</b>：凑十法、破十法打基础，再提速、再综合</p>
            <p>📈 <b>看得见的进步</b>：诊断测 + 每日记录 + 阶段测评 + 家长周报</p>
          </div>
        </motion.div>

        {/* Plan overview */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-lg mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">60 天分阶段计划</h2>
          <div className="space-y-2.5">
            {PHASES.map((p) => (
              <div key={p.phase} className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: p.bg }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#fff' }}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{p.range}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.goal}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-around pt-3 border-t border-gray-50">
            <div className="text-center">
              <p className="text-lg font-black text-[#F59E0B]">{TOTAL_DAYS}</p>
              <p className="text-[10px] text-gray-400">天</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#EF4444]">{getTotalQuestions()}</p>
              <p className="text-[10px] text-gray-400">题量</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#8B5CF6]">4</p>
              <p className="text-[10px] text-gray-400">阶段</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#10B981]">5</p>
              <p className="text-[10px] text-gray-400">技巧</p>
            </div>
          </div>
        </motion.div>

        {/* Enroll form */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-5 shadow-lg mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">开始入营</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">孩子昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：小明"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">9月开学年级</label>
              <div className="grid grid-cols-3 gap-2">
                {['二年级', '三年级', '四年级'].map((g) => (
                  <button
                    key={g}
                    onClick={() => { playClickSound(); setGrade(g); }}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      grade === g ? 'bg-[#F59E0B] text-white shadow-md' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleEnroll}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white text-sm font-black shadow-lg shadow-orange-300/50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" /> 开启 60 天突击之旅
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">入营后先做能力诊断测，量身定制训练节奏</p>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function SummerCampHome() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  // 当前应训练天数（按日历）与 store 中 currentDay 取较大
  const calendarDay = useMemo(() => getCurrentDay(camp.startDate), [camp.startDate]);
  const activeDay = Math.max(camp.currentDay, calendarDay || 1, 1);
  const todayPlan = getDayPlan(Math.min(activeDay, TOTAL_DAYS));
  const completedCount = getCompletedDayCount(camp);
  const overallAccuracy = getTotalAccuracy(camp);
  const streak = getStreakDays(camp);
  const progressPercent = Math.round((completedCount / TOTAL_DAYS) * 100);

  const todayRecord = camp.completedDays[activeDay];
  const todayDone = !!todayRecord?.completed;
  const todayPhase = todayPlan ? getPhaseInfo(todayPlan.phase) : null;

  // 阶段筛选展示
  const phaseDays = useMemo(() => {
    const p = selectedPhase > 0 ? selectedPhase : (todayPlan?.phase ?? 1);
    return DAYS.filter((d) => d.phase === p);
  }, [selectedPhase, todayPlan]);
  const displayPhase = selectedPhase > 0 ? getPhaseInfo(selectedPhase)! : todayPhase!;

  const diagnosticDone = !!camp.diagnosticPre;

  if (!camp.enrolled) {
    return (
      <>
        <EnrollmentCard />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#F59E0B] via-[#EF4444] to-[#8B5CF6] pb-20 pt-5 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3" />
        <div className="mx-auto max-w-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { playClickSound(); setCurrentView('home'); }}
              className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2 active:scale-95 transition-transform min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 返回
            </button>
            <span className="text-white/80 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-3 py-2">
              🏰 暑期训练营
            </span>
          </div>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-white text-xl font-black mb-1">
              Hi, {camp.childName} 👋
            </h1>
            <p className="text-white/70 text-xs mb-4">{camp.childGrade} · 60天加减法突击</p>

            {/* 4 stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Calendar, label: '已完成', value: `${completedCount}天`, color: '#FDE68A' },
                { icon: Flame, label: '连续', value: `${streak}天`, color: '#FCA5A5' },
                { icon: Target, label: '正确率', value: `${overallAccuracy}%`, color: '#FBCFE8' },
                { icon: TrendingUp, label: '进度', value: `${progressPercent}%`, color: '#DDD6FE' },
              ].map((s) => (
                <div key={s.label} className="bg-white/15 backdrop-blur-md rounded-2xl py-2.5 px-1.5 text-center">
                  <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: s.color }} />
                  <p className="text-white text-sm font-black">{s.value}</p>
                  <p className="text-white/60 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ Progress ring (overlap) ═══ */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 -mt-12 relative z-20 mb-4">
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-orange-200/30">
          <div className="flex items-center gap-4">
            {/* Ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none" stroke="url(#campGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progressPercent / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="campGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-gray-800">{completedCount}</span>
                <span className="text-[9px] text-gray-400 -mt-0.5">/ {TOTAL_DAYS}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-800 mb-0.5">总进度</p>
              <p className="text-[11px] text-gray-500 mb-2">已坚持 {completedCount} 天，再接再厉！</p>
              <div className="flex items-center gap-1.5">
                {PHASES.map((p) => {
                  const phaseComplete = DAYS.filter((d) => d.phase === p.phase).every((d) => camp.completedDays[d.day]?.completed);
                  const phaseStarted = DAYS.some((d) => d.phase === p.phase && camp.completedDays[d.day]?.completed);
                  return (
                    <div key={p.phase} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full h-1.5 rounded-full ${phaseComplete ? '' : ''}`}
                        style={{ backgroundColor: phaseComplete ? p.color : phaseStarted ? `${p.color}60` : '#F3F4F6' }}
                      />
                      <span className="text-[8px] text-gray-400 mt-1">{p.emoji}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Today's task ═══ */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" /> 今日任务
          {todayPlan?.isTest && <span className="text-[10px] bg-red-100 text-red-500 rounded-full px-2 py-0.5 font-bold">测评日</span>}
        </h2>
        {todayPlan && (
          <div className="rounded-3xl p-5 shadow-lg relative overflow-hidden" style={{ backgroundColor: todayPhase?.bg }}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ backgroundColor: `${todayPhase?.color}10` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-white rounded-full px-2 py-1" style={{ backgroundColor: todayPhase?.color }}>
                  Day {todayPlan.day}
                </span>
                <span className="text-[10px] font-medium" style={{ color: todayPhase?.color }}>{todayPhase?.name}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="text-4xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >{todayPlan.emoji}</motion.div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-800">{todayPlan.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">基础 {todayPlan.count} 题 · 限时挑战 {todayPlan.speedCount} 题</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur rounded-2xl p-3 mb-3 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">{todayPlan.tip}</p>
              </div>
              {todayDone ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-2xl py-3 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                    <span className="text-sm font-bold text-[#10B981]">今日已完成</span>
                    <span className="text-xs text-gray-400">· 正确率 {todayRecord.accuracy}%</span>
                  </div>
                  <button
                    onClick={() => { playClickSound(); setCurrentView('summer-daily'); }}
                    className="px-4 py-3 rounded-2xl bg-white text-xs font-bold active:scale-95 transition-transform"
                    style={{ color: todayPhase?.color }}
                  >
                    再练一次
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { playClickSound(); setCurrentView('summer-daily'); }}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                  style={{ backgroundColor: todayPhase?.color, boxShadow: `0 6px 16px ${todayPhase?.color}40` }}
                >
                  <Play className="w-4 h-4 fill-white" /> 开始今日训练
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ Diagnostic banner (if not done) ═══ */}
      {!diagnosticDone && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
          <button
            onClick={() => { playClickSound(); setCurrentView('summer-diagnostic'); }}
            className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-3xl p-4 shadow-lg shadow-emerald-200/40 active:scale-[0.98] transition-transform flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🩺</div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">先做能力诊断测</p>
              <p className="text-[11px] text-white/80">30题摸底，找出薄弱环节</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80" />
          </button>
        </motion.div>
      )}

      {/* ═══ Free Practice Entry (prominent) ═══ */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
        <button
          onClick={() => { playClickSound(); setCurrentView('summer-free'); }}
          className="w-full relative overflow-hidden rounded-3xl p-4 text-left active:scale-[0.98] transition-transform shadow-lg"
          style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 50%, #6366F1 100%)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
          <div className="relative z-10 flex items-center gap-3">
            <motion.div
              className="text-4xl"
              animate={{ y: [0, -4, 0], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >🎯</motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-sm font-black text-white">自由训练</h3>
                <span className="text-[9px] bg-white/25 text-white rounded-full px-1.5 py-0.5 font-bold">想练什么直接选</span>
              </div>
              <p className="text-[11px] text-white/85">
                {camp.freePracticeHistory.length > 0
                  ? `已练 ${camp.freePracticeHistory.length} 次 · ${Object.keys(camp.topicStats).filter(k => camp.topicStats[k].attempts > 0).length} 个题型`
                  : '100以内加减法、进位退位… 任选题型开练'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
          </div>
        </button>
      </motion.div>

      {/* ═══ Quick entries ═══ */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
        <h2 className="text-sm font-bold text-gray-800 mb-3">训练营工具</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: GraduationCap, title: '能力诊断', view: 'summer-diagnostic', color: '#10B981', sub: camp.diagnosticPre ? '已测' : '去测' },
            { icon: BookOpen, title: '计算技巧', view: 'summer-skills', color: '#F59E0B', sub: '5个' },
            { icon: FileBarChart, title: '家长周报', view: 'summer-report', color: '#8B5CF6', sub: '查看' },
          ].map((a) => (
            <motion.button
              key={a.title}
              whileTap={{ scale: 0.93 }}
              onClick={() => { playClickSound(); setCurrentView(a.view); }}
              className="bg-white rounded-2xl p-3 text-center shadow-sm active:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${a.color}12` }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <p className="text-[11px] font-bold text-gray-800">{a.title}</p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: a.color }}>{a.sub}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ═══ 60-day map ═══ */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">📅 推荐训练路径</h2>
          <span className="text-[10px] text-gray-400">可按计划走，也可自由选</span>
        </div>
        {/* Phase tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {PHASES.map((p) => {
            const isActive = (selectedPhase > 0 ? selectedPhase : todayPlan?.phase) === p.phase;
            return (
              <button
                key={p.phase}
                onClick={() => { playClickSound(); setSelectedPhase(p.phase); }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isActive ? 'text-white shadow-md' : 'bg-white text-gray-500'
                }`}
                style={isActive ? { backgroundColor: p.color } : {}}
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Days grid */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="grid grid-cols-5 gap-2">
            {phaseDays.map((d) => {
              const record = camp.completedDays[d.day];
              const done = !!record?.completed;
              const isToday = d.day === activeDay;
              const isFuture = d.day > activeDay;
              const phaseInfo = getPhaseInfo(d.phase)!;
              return (
                <button
                  key={d.day}
                  onClick={() => {
                    playClickSound();
                    // 所有日子都可点击，进入对应天的计划训练
                    // 通过 sessionStorage 传递 day，daily 页会优先用 store.currentDay
                    // 但为了支持任意天，我们临时设置 currentDay
                    useSummerCampStore.setState({ currentDay: d.day });
                    // 清除可能的 free topic
                    try { sessionStorage.removeItem('summer-free-topic'); } catch { /* ignore */ }
                    setCurrentView('summer-daily');
                  }}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                    done ? 'shadow-sm' : isFuture ? 'bg-gray-50 opacity-60' : 'bg-white border-2'
                  }`}
                  style={done ? { backgroundColor: `${phaseInfo.color}15` } : isToday ? { borderColor: phaseInfo.color } : {}}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: phaseInfo.color }} />
                  ) : (
                    <span className="text-base">{d.emoji}</span>
                  )}
                  <span className={`text-[9px] font-bold mt-0.5 ${done ? '' : isFuture ? 'text-gray-400' : 'text-gray-600'}`} style={done ? { color: phaseInfo.color } : {}}>
                    {d.day}
                  </span>
                  {isToday && !done && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: phaseInfo.color }} />
                  )}
                  {d.isTest && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] bg-red-500 text-white rounded px-1 font-bold">测</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <span>{displayPhase.emoji} {displayPhase.name} · {displayPhase.range}</span>
            <span>{phaseDays.filter((d) => camp.completedDays[d.day]?.completed).length} / {phaseDays.length} 完成</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ Diagnostic comparison (if both done) ═══ */}
      {camp.diagnosticPre && camp.diagnosticPost && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-md px-4 pb-28">
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" /> 前后测对比
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">入营前</p>
                <p className="text-2xl font-black text-gray-700">{camp.diagnosticPre.accuracy}%</p>
                <p className="text-[9px] text-gray-400">正确率</p>
              </div>
              <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#EF4444]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">结营后</p>
                <p className="text-2xl font-black" style={{ color: '#EF4444' }}>{camp.diagnosticPost.accuracy}%</p>
                <p className="text-[9px] font-medium text-[#10B981]">
                  +{Math.max(0, camp.diagnosticPost.accuracy - camp.diagnosticPre.accuracy)}% 提升
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
}
