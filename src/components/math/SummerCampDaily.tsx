'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Clock, Delete, Flame, Lightbulb, Play,
  Star, Target, Trophy, XCircle, Zap, ChevronRight, Award, RotateCcw,
} from 'lucide-react';
import { useSummerCampStore } from '@/lib/summer-camp-store';
import type { FreePracticeRecord } from '@/lib/summer-camp-store';
import { useGameStore } from '@/lib/game-store';
import { getDayPlan, getPhaseInfo, getFreeTopic, FREE_CATEGORIES, type FreeTopic, type QuestionFocus } from '@/lib/summer-camp/plan';
import { generateCampQuestions } from '@/lib/summer-camp/questions';
import type { MathQuestion } from '@/lib/math-utils';
import { calculateStars, formatTimeChinese } from '@/lib/math-utils';
import { addError } from '@/lib/error-book';
import { playClickSound, playCorrectSound, playWrongSound, resumeAudioContext } from '@/lib/sound';
import BottomNav from './BottomNav';

type Stage = 'intro' | 'base' | 'base-result' | 'speed' | 'result';

interface SessionState {
  questions: MathQuestion[];
  index: number;
  correct: number;
  wrong: number;
  startTime: number;
  questionStart: number;
  combo: number;
  maxCombo: number;
  answers: { questionId: string; answer: number; correct: boolean; timeMs: number }[];
  timeLeft?: number; // for speed stage
}

// ─── Confetti ───────────────────────────────────────────────────────────────

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.3,
  color: ['#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899'][i % 5],
  size: 6 + Math.random() * 6,
}));

// ─── Component ──────────────────────────────────────────────────────────────

export default function SummerCampDaily() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const recordDay = useSummerCampStore((s) => s.recordDay);
  const recordFreePractice = useSummerCampStore((s) => s.recordFreePractice);

  const [stage, setStage] = useState<Stage>('intro');
  const [baseSession, setBaseSession] = useState<SessionState | null>(null);
  const [speedSession, setSpeedSession] = useState<SessionState | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [freeRecord, setFreeRecord] = useState<FreePracticeRecord | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 模式判断：自由训练（从 sessionStorage 读取选题）或计划训练
  const freeTopic: FreeTopic | null = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('summer-free-topic');
      if (raw) return JSON.parse(raw) as FreeTopic;
    } catch { /* ignore */ }
    return null;
  }, []);

  // 训练参数：合并 plan 和 freeTopic 两种来源
  const calendarDay = camp.currentDay;
  const plan = getDayPlan(calendarDay);
  const phaseInfo = plan ? getPhaseInfo(plan.phase) : null;
  const existingRecord = plan ? camp.completedDays[plan.day] : null;

  // 统一的训练配置
  const focus: QuestionFocus = freeTopic?.id ?? plan?.focus ?? 'mix-20';
  const topicName: string = freeTopic?.name ?? plan?.title ?? '训练';
  const topicEmoji: string = freeTopic?.emoji ?? plan?.emoji ?? '📝';
  const topicTip: string = freeTopic
    ? `自由训练：${freeTopic.name}。${freeTopic.desc}`
    : (plan?.tip ?? '认真计算，看清符号！');
  const baseCount: number = freeTopic?.count ?? plan?.count ?? 15;
  const speedCount: number = freeTopic?.speedCount ?? plan?.speedCount ?? 20;
  const speedSeconds: number = freeTopic?.speedSeconds ?? plan?.speedSeconds ?? 80;
  const isTest: boolean = plan?.isTest ?? false;
  const themeColor: string = freeTopic
    ? (FREE_CATEGORIES.find((c) => c.topics.some((t) => t.id === freeTopic.id))?.color ?? '#06B6D4')
    : (phaseInfo?.color ?? '#F59E0B');
  const themeBg: string = freeTopic
    ? (FREE_CATEGORIES.find((c) => c.topics.some((t) => t.id === freeTopic.id))?.bg ?? '#ECFEFF')
    : (phaseInfo?.bg ?? '#FFF7ED');

  // Resume audio
  useEffect(() => {
    const h = () => resumeAudioContext();
    document.addEventListener('touchstart', h, { once: true });
    document.addEventListener('click', h, { once: true });
    return () => {
      document.removeEventListener('touchstart', h);
      document.removeEventListener('click', h);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (speedTimer.current) clearInterval(speedTimer.current);
    };
  }, []);

  // ── Start base practice ──
  const startBase = useCallback(() => {
    const questions = generateCampQuestions(focus, baseCount);
    setBaseSession({
      questions,
      index: 0,
      correct: 0,
      wrong: 0,
      startTime: Date.now(),
      questionStart: Date.now(),
      combo: 0,
      maxCombo: 0,
      answers: [],
    });
    setInput('');
    setFeedback(null);
    setStage('base');
  }, [focus, baseCount]);

  // ── Start speed challenge ──
  const startSpeed = useCallback(() => {
    const questions = generateCampQuestions(focus, speedCount);
    setSpeedSession({
      questions,
      index: 0,
      correct: 0,
      wrong: 0,
      startTime: Date.now(),
      questionStart: Date.now(),
      combo: 0,
      maxCombo: 0,
      answers: [],
      timeLeft: speedSeconds,
    });
    setInput('');
    setFeedback(null);
    setStage('speed');
  }, [focus, speedCount, speedSeconds]);

  // ── Finish speed & save record ──
  const finishSpeed = useCallback((finalSpeed: SessionState) => {
    if (!baseSession) return;
    if (speedTimer.current) clearInterval(speedTimer.current);

    const baseCorrect = baseSession.correct;
    const baseTotal = baseSession.questions.length;
    const baseTimeMs = Date.now() - baseSession.startTime;

    const speedCorrect = finalSpeed.correct;
    const speedTotal = finalSpeed.questions.length;
    const speedTimeMs = speedSeconds - (finalSpeed.timeLeft ?? 0); // actual elapsed
    const actualSpeedTime = Math.min(speedTimeMs, speedSeconds) * 1000;

    const totalCorrect = baseCorrect + speedCorrect;
    const totalQuestions = baseTotal + speedTotal;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const totalTimeMs = baseTimeMs + actualSpeedTime;
    const avgTimeMs = Math.round(totalTimeMs / totalQuestions);
    const stars = calculateStars(totalCorrect, totalQuestions);
    const todayStr = new Date().toISOString().split('T')[0];

    if (freeTopic) {
      // 自由训练：记录到 freePracticeHistory
      const rec: FreePracticeRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topicId: freeTopic.id,
        topicName: freeTopic.name,
        date: todayStr,
        baseCorrect,
        baseTotal,
        speedCorrect,
        speedTotal,
        timeMs: totalTimeMs,
        accuracy,
        avgTimeMs,
        stars,
      };
      recordFreePractice(rec);
      setFreeRecord(rec);
    } else if (plan) {
      // 计划训练：记录到 completedDays
      recordDay({
        day: plan.day,
        date: todayStr,
        baseCorrect,
        baseTotal,
        baseTimeMs,
        speedCorrect,
        speedTotal,
        speedTimeMs: actualSpeedTime,
        accuracy,
        avgTimeMs,
        stars,
        completed: true,
      });
    }

    if (stars >= 2) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
    setStage('result');
  }, [baseSession, speedSeconds, freeTopic, plan, recordDay, recordFreePractice]);

  // ── Speed countdown ──
  useEffect(() => {
    if (stage !== 'speed' || !speedSession) return;
    speedTimer.current = setInterval(() => {
      setSpeedSession((prev) => {
        if (!prev || prev.timeLeft === undefined) return prev;
        const newLeft = prev.timeLeft - 1;
        if (newLeft <= 0) {
          // time up → finish speed
          clearInterval(speedTimer.current!);
          // finish with current progress
          setTimeout(() => finishSpeed(prev), 100);
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: newLeft };
      });
    }, 1000);
    return () => {
      if (speedTimer.current) clearInterval(speedTimer.current);
    };
  }, [stage, finishSpeed]);

  // ── Answer handler ──
  const handleAnswer = useCallback((sessionType: 'base' | 'speed') => {
    const session = sessionType === 'base' ? baseSession : speedSession;
    const setSession = sessionType === 'base' ? setBaseSession : setSpeedSession;
    if (!session) return;
    const current = session.questions[session.index];
    if (!current) return;
    const answerNum = parseInt(input, 10);
    if (isNaN(answerNum)) return;

    const timeMs = Date.now() - session.questionStart;
    const isCorrect = answerNum === Number(current.correctAnswer);

    // record answer
    const newAnswers = [...session.answers, { questionId: current.id, answer: answerNum, correct: isCorrect, timeMs }];
    const newCorrect = session.correct + (isCorrect ? 1 : 0);
    const newWrong = session.wrong + (isCorrect ? 0 : 1);
    const newCombo = isCorrect ? session.combo + 1 : 0;
    const newMaxCombo = Math.max(session.maxCombo, newCombo);

    // feedback
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrectSound();
    else {
      playWrongSound();
      // add to error book
      addError({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subject: 'math',
        expression: current.expression,
        correctAnswer: current.correctAnswer,
        userAnswer: answerNum,
        operation: current.operation === 'add' ? '加法' : current.operation === 'subtract' ? '减法' : current.operation,
        difficulty: isTest ? 'hard' : 'medium',
        mode: sessionType === 'base' ? 'free' : 'speed',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        reviewCount: 0,
        mastered: false,
        grade: (plan?.phase ?? 3) <= 2 ? 1 : 2,
      });
    }

    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      setInput('');
      const isLast = session.index + 1 >= session.questions.length;
      if (isLast) {
        const finalSession = { ...session, correct: newCorrect, wrong: newWrong, combo: newCombo, maxCombo: newMaxCombo, answers: newAnswers };
        setSession(finalSession);
        if (sessionType === 'base') {
          setStage('base-result');
        } else {
          finishSpeed(finalSession);
        }
      } else {
        setSession({
          ...session,
          index: session.index + 1,
          correct: newCorrect,
          wrong: newWrong,
          combo: newCombo,
          maxCombo: newMaxCombo,
          answers: newAnswers,
          questionStart: Date.now(),
        });
      }
    }, isCorrect ? 500 : 1100);
  }, [baseSession, speedSession, input, isTest, plan, finishSpeed]);

  // ── Number pad input ──
  const pressKey = (key: string) => {
    playClickSound();
    if (key === 'del') {
      setInput((p) => p.slice(0, -1));
    } else if (key === 'neg') {
      setInput((p) => (p.startsWith('-') ? p.slice(1) : '-' + p));
    } else if (key === 'ok') {
      handleAnswer(stage === 'speed' ? 'speed' : 'base');
    } else {
      if (input.length < 5) setInput((p) => p + key);
    }
  };

  // ── INTRO STAGE ──
  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-[#F7F8FC]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-28">
          <button
            onClick={() => {
              playClickSound();
              // 自由模式返回 free 页，计划模式返回 camp
              if (freeTopic) {
                try { sessionStorage.removeItem('summer-free-topic'); } catch { /* ignore */ }
                setCurrentView('summer-free');
              } else {
                setCurrentView('summer-camp');
              }
            }}
            className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-white rounded-full px-3 py-2 mb-4 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {freeTopic ? '返回自由训练' : '返回训练营'}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 shadow-xl relative overflow-hidden mb-4"
            style={{ backgroundColor: themeBg }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ backgroundColor: `${themeColor}10` }} />
            <div className="relative z-10 text-center">
              <span className="inline-block text-[10px] font-bold text-white rounded-full px-3 py-1 mb-3" style={{ backgroundColor: themeColor }}>
                {freeTopic ? '🎯 自由训练' : `${phaseInfo?.emoji} ${phaseInfo?.name} · Day ${plan?.day}`}
              </span>
              <motion.div
                className="text-6xl mb-3"
                animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >{topicEmoji}</motion.div>
              <h1 className="text-xl font-black text-gray-800 mb-2">{topicName}</h1>
              {isTest && (
                <span className="inline-block text-[10px] bg-red-100 text-red-500 rounded-full px-2 py-0.5 font-bold mb-2">📋 测评日</span>
              )}
              <div className="bg-white/70 backdrop-blur rounded-2xl p-3 mt-3 flex items-start gap-2 text-left">
                <Lightbulb className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">{topicTip}</p>
              </div>
            </div>
          </motion.div>

          {/* Two stages preview */}
          <div className="space-y-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-lg">📝</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">第一阶段 · 基础练习</p>
                <p className="text-[11px] text-gray-400">{baseCount} 题 · 不限时 · 打牢方法</p>
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 rounded-full px-2 py-1">基础</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-lg">⚡</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">第二阶段 · 限时挑战</p>
                <p className="text-[11px] text-gray-400">{speedCount} 题 · {speedSeconds}秒 · 冲刺速度</p>
              </div>
              <span className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 rounded-full px-2 py-1">提速</span>
            </div>
          </div>

          {!freeTopic && existingRecord?.completed && (
            <div className="bg-amber-50 rounded-2xl p-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">今日已完成，正确率 {existingRecord.accuracy}%，可再练一次刷新记录</p>
            </div>
          )}
          {freeTopic && camp.topicStats[freeTopic.id]?.attempts > 0 && (
            <div className="bg-cyan-50 rounded-2xl p-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <p className="text-[11px] text-cyan-700">
                已练 {camp.topicStats[freeTopic.id].attempts} 次 · 最佳 {camp.topicStats[freeTopic.id].bestAccuracy}%
              </p>
            </div>
          )}

          <button
            onClick={() => { playClickSound(); startBase(); }}
            className="w-full py-4 rounded-2xl text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ backgroundColor: themeColor, boxShadow: `0 8px 20px ${themeColor}40` }}
          >
            <Play className="w-4 h-4 fill-white" /> 开始训练
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── BASE-RESULT STAGE ──
  if (stage === 'base-result' && baseSession) {
    const baseAcc = Math.round((baseSession.correct / baseSession.questions.length) * 100);
    const baseTime = Date.now() - baseSession.startTime;
    return (
      <div className="min-h-screen bg-[#F7F8FC]">
        <div className="mx-auto max-w-md px-4 pt-8 pb-28">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 shadow-xl text-center mb-4">
            <div className="text-5xl mb-3">{baseAcc >= 90 ? '🌟' : baseAcc >= 75 ? '👍' : '💪'}</div>
            <h2 className="text-lg font-black text-gray-800 mb-1">基础练习完成！</h2>
            <p className="text-xs text-gray-400 mb-4">接下来挑战限时提速</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xl font-black text-[#10B981]">{baseSession.correct}/{baseSession.questions.length}</p>
                <p className="text-[10px] text-gray-400">正确</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xl font-black text-[#F59E0B]">{baseAcc}%</p>
                <p className="text-[10px] text-gray-400">正确率</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xl font-black text-[#8B5CF6]">{formatTimeChinese(baseTime)}</p>
                <p className="text-[10px] text-gray-400">用时</p>
              </div>
            </div>
            <button
              onClick={() => { playClickSound(); startSpeed(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> 开始限时挑战
            </button>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── RESULT STAGE ──
  if (stage === 'result' && baseSession && speedSession) {
    const baseCorrect = baseSession.correct;
    const baseTotal = baseSession.questions.length;
    const totalCorrect = baseCorrect + speedSession.correct;
    const totalQuestions = baseTotal + speedSession.questions.length;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const stars = calculateStars(totalCorrect, totalQuestions);
    // 计算总用时：自由模式用 freeRecord，计划模式用 savedRecord，回退到 session
    const baseTimeMs = freeRecord?.timeMs
      ? (freeRecord.timeMs - Math.min(speedSeconds, speedSeconds - (speedSession.timeLeft ?? 0)) * 1000)
      : (plan ? (camp.completedDays[plan.day]?.baseTimeMs ?? (Date.now() - baseSession.startTime)) : (Date.now() - baseSession.startTime));
    const speedTimeMs = freeRecord
      ? (freeRecord.timeMs - baseTimeMs)
      : (plan ? (camp.completedDays[plan.day]?.speedTimeMs ?? (speedSeconds * 1000)) : (speedSeconds * 1000));
    const totalTime = baseTimeMs + speedTimeMs;
    const isBest = accuracy >= 90;
    const resultLabel = freeTopic ? topicName : `Day ${plan?.day} · ${plan?.title}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF7ED] to-[#F7F8FC]">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {CONFETTI.map((c) => (
              <motion.div
                key={c.id}
                className="absolute rounded-full"
                style={{ left: `${c.x}%`, top: '-20px', width: c.size, height: c.size, backgroundColor: c.color }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: '100vh', opacity: [1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.5, delay: c.delay, ease: 'easeIn' }}
              />
            ))}
          </div>
        )}
        <div className="mx-auto max-w-md px-4 pt-8 pb-28">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="bg-white rounded-3xl p-6 shadow-xl text-center mb-4"
          >
            <motion.div
              className="text-6xl mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              {isBest ? '🏆' : accuracy >= 75 ? '🌟' : '💪'}
            </motion.div>
            <h2 className="text-xl font-black text-gray-800 mb-1">
              {isBest ? '太棒了！' : accuracy >= 75 ? '做得不错！' : '继续加油！'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">{resultLabel} 训练完成</p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + s * 0.15, type: 'spring', stiffness: 300 }}
                >
                  <Star className={`w-10 h-10 ${s <= stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-200'}`} />
                </motion.div>
              ))}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#10B981]/8 rounded-2xl p-3">
                <p className="text-2xl font-black text-[#10B981]">{totalCorrect}/{totalQuestions}</p>
                <p className="text-[10px] text-gray-400">总正确数</p>
              </div>
              <div className="bg-[#F59E0B]/8 rounded-2xl p-3">
                <p className="text-2xl font-black text-[#F59E0B]">{accuracy}%</p>
                <p className="text-[10px] text-gray-400">正确率</p>
              </div>
              <div className="bg-[#8B5CF6]/8 rounded-2xl p-3">
                <p className="text-2xl font-black text-[#8B5CF6]">{formatTimeChinese(totalTime)}</p>
                <p className="text-[10px] text-gray-400">总用时</p>
              </div>
              <div className="bg-[#EF4444]/8 rounded-2xl p-3">
                <p className="text-2xl font-black text-[#EF4444]">{speedSession.maxCombo}</p>
                <p className="text-[10px] text-gray-400">最高连击</p>
              </div>
            </div>

            {/* Phase breakdown */}
            <div className="bg-gray-50 rounded-2xl p-3 mb-5 text-left">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">📝 基础练习</span>
                <span className="font-bold text-gray-700">{baseCorrect}/{baseTotal} 正确</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">⚡ 限时挑战</span>
                <span className="font-bold text-gray-700">{speedSession.correct}/{speedSession.questions.length} 正确</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => { playClickSound(); setStage('intro'); setBaseSession(null); setSpeedSession(null); setFreeRecord(null); }}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> 再练一次
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  if (freeTopic) {
                    try { sessionStorage.removeItem('summer-free-topic'); } catch { /* ignore */ }
                    setCurrentView('summer-free');
                  } else {
                    setCurrentView('summer-camp');
                  }
                }}
                className="flex-[2] py-3 rounded-2xl text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1"
                style={{ backgroundColor: themeColor }}
              >
                <ChevronRight className="w-4 h-4" /> {freeTopic ? '返回自由训练' : '返回训练营'}
              </button>
            </div>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── PLAYING STAGES (base / speed) ──
  const session = stage === 'base' ? baseSession : speedSession;
  if (!session) return null;
  const current = session.questions[session.index];
  if (!current) return null;
  const progress = (session.index / session.questions.length) * 100;
  const isSpeed = stage === 'speed';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {CONFETTI.map((c) => (
              <motion.div
                key={c.id}
                className="absolute rounded-full"
                style={{ left: `${c.x}%`, top: '-20px', width: c.size, height: c.size, backgroundColor: c.color }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: '100vh', opacity: [1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.5, delay: c.delay, ease: 'easeIn' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-white shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (confirm('确定退出吗？本次训练进度将不保存')) {
                  if (speedTimer.current) clearInterval(speedTimer.current);
                  if (freeTopic) {
                    try { sessionStorage.removeItem('summer-free-topic'); } catch { /* ignore */ }
                    setCurrentView('summer-free');
                  } else {
                    setCurrentView('summer-camp');
                  }
                }
              }}
              className="flex items-center gap-1 text-gray-400 text-xs font-medium min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 退出
            </button>
            <span className="text-xs font-bold" style={{ color: themeColor }}>
              {isSpeed ? '⚡ 限时挑战' : '📝 基础练习'}
            </span>
            <span className="text-xs font-bold text-gray-600">
              {session.index + 1}/{session.questions.length}
            </span>
          </div>
          {/* progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: themeColor }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* secondary stats */}
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-gray-400">✓ {session.correct}  ✗ {session.wrong}</span>
            {session.combo >= 2 && (
              <span className="flex items-center gap-0.5 text-[#F59E0B] font-bold">
                <Flame className="w-3 h-3" /> {session.combo}连击
              </span>
            )}
            {isSpeed && session.timeLeft !== undefined && (
              <span className={`flex items-center gap-0.5 font-bold ${session.timeLeft <= 10 ? 'text-red-500' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" /> {session.timeLeft}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          key={current.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center mb-8"
        >
          <p className="text-xs text-gray-400 mb-3">算一算</p>
          <div className="text-6xl font-black text-gray-800 tracking-wider">
            {current.expression} = <span className="text-[#F59E0B]">?</span>
          </div>
        </motion.div>

        {/* Input display */}
        <div className="mb-6 min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="fc" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-center gap-2 text-[#10B981]">
                <CheckCircle2 className="w-12 h-12" />
                <span className="text-3xl font-black">{input}</span>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="fw" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-center gap-2 text-[#EF4444]">
                <XCircle className="w-12 h-12" />
                <div>
                  <span className="text-2xl font-black line-through">{input}</span>
                  <p className="text-sm font-bold">正确：{current.correctAnswer}</p>
                </div>
              </motion.div>
            )}
            {!feedback && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`text-5xl font-black ${input ? 'text-gray-800' : 'text-gray-300'}`}>
                {input || '?'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Number pad */}
      <div className="px-4 pb-6 bg-white">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'neg', '0', 'del'].map((k) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              className={`h-14 rounded-2xl text-xl font-black active:scale-95 transition-transform shadow-sm ${
                k === 'del' ? 'bg-gray-100 text-gray-500' : k === 'neg' ? 'bg-gray-100 text-gray-500 text-base' : 'bg-white text-gray-800'
              }`}
            >
              {k === 'del' ? <Delete className="w-5 h-5 mx-auto" /> : k === 'neg' ? '±' : k}
            </button>
          ))}
          <button
            onClick={() => pressKey('ok')}
            className="h-14 rounded-2xl text-white text-lg font-black active:scale-95 transition-transform shadow-md col-span-3"
            style={{ backgroundColor: themeColor }}
          >
            确定 ✓
          </button>
        </div>
      </div>
    </div>
  );
}
