'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Clock, Delete, Lightbulb, Play, RotateCcw,
  Star, TrendingUp, Trophy, XCircle, Zap, ChevronRight, Target, AlertTriangle,
} from 'lucide-react';
import { useSummerCampStore } from '@/lib/summer-camp-store';
import type { DiagnosticResult } from '@/lib/summer-camp-store';
import { useGameStore } from '@/lib/game-store';
import { generateDiagnosticTagged } from '@/lib/summer-camp/questions';
import type { DiagnosticDimension } from '@/lib/summer-camp/questions';
import type { MathQuestion } from '@/lib/math-utils';
import { formatTimeChinese } from '@/lib/math-utils';
import { addError } from '@/lib/error-book';
import { playClickSound, playCorrectSound, playWrongSound, resumeAudioContext } from '@/lib/sound';
import BottomNav from './BottomNav';

type Stage = 'intro' | 'testing' | 'result';

interface TestState {
  items: { question: MathQuestion; dimension: DiagnosticDimension; dimensionLabel: string }[];
  index: number;
  correct: number;
  wrong: number;
  startTime: number;
  questionStart: number;
  answers: { dimension: DiagnosticDimension; correct: boolean; timeMs: number }[];
}

const DIMENSION_INFO: Record<DiagnosticDimension, { label: string; emoji: string; color: string }> = {
  add20: { label: '20以内加法', emoji: '➕', color: '#10B981' },
  sub20: { label: '20以内减法', emoji: '➖', color: '#F59E0B' },
  add100: { label: '100以内加法', emoji: '🔵', color: '#EF4444' },
  sub100: { label: '100以内减法', emoji: '🟠', color: '#8B5CF6' },
  speed: { label: '综合速度', emoji: '⚡', color: '#EC4899' },
};

export default function SummerCampDiagnostic() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const setDiagnosticPre = useSummerCampStore((s) => s.setDiagnosticPre);
  const setDiagnosticPost = useSummerCampStore((s) => s.setDiagnosticPost);

  const [stage, setStage] = useState<Stage>('intro');
  const [test, setTest] = useState<TestState | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  // 本地缓存本次诊断结果，避免 store 更新时序导致 result 为 null
  const [localResult, setLocalResult] = useState<DiagnosticResult | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // pre or post?  pre if not done, else post (only allow post near end)
  const isPost = !!camp.diagnosticPre;
  const completedDayCount = useMemo(() => Object.values(camp.completedDays).filter((d) => d.completed).length, [camp.completedDays]);

  useEffect(() => {
    const h = () => resumeAudioContext();
    document.addEventListener('touchstart', h, { once: true });
    document.addEventListener('click', h, { once: true });
    return () => {
      document.removeEventListener('touchstart', h);
      document.removeEventListener('click', h);
    };
  }, []);

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  const startTest = useCallback(() => {
    const items = generateDiagnosticTagged();
    setTest({
      items,
      index: 0,
      correct: 0,
      wrong: 0,
      startTime: Date.now(),
      questionStart: Date.now(),
      answers: [],
    });
    setInput('');
    setFeedback(null);
    setStage('testing');
  }, []);

  const finishTest = useCallback((finalTest: TestState) => {
    const totalCorrect = finalTest.correct;
    const totalQuestions = finalTest.items.length;
    const totalTimeMs = Date.now() - finalTest.startTime;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const avgTimeMs = Math.round(totalTimeMs / totalQuestions);

    // by dimension
    const byDimension = {
      add20: { correct: 0, total: 0 },
      sub20: { correct: 0, total: 0 },
      add100: { correct: 0, total: 0 },
      sub100: { correct: 0, total: 0 },
      speed: { correct: 0, total: 0 },
    };
    for (const a of finalTest.answers) {
      byDimension[a.dimension].total++;
      if (a.correct) byDimension[a.dimension].correct++;
    }

    const result = {
      date: new Date().toISOString().split('T')[0],
      totalCorrect,
      totalQuestions,
      totalTimeMs,
      accuracy,
      avgTimeMs,
      byDimension,
    };

    if (isPost) setDiagnosticPost(result);
    else setDiagnosticPre(result);
    setLocalResult(result);
    setStage('result');
  }, [isPost, setDiagnosticPre, setDiagnosticPost]);

  const handleAnswer = useCallback(() => {
    if (!test) return;
    const current = test.items[test.index];
    if (!current) return;
    const answerNum = parseInt(input, 10);
    if (isNaN(answerNum)) return;

    const timeMs = Date.now() - test.questionStart;
    const isCorrect = answerNum === Number(current.question.correctAnswer);
    const newAnswers = [...test.answers, { dimension: current.dimension, correct: isCorrect, timeMs }];
    const newCorrect = test.correct + (isCorrect ? 1 : 0);
    const newWrong = test.wrong + (isCorrect ? 0 : 1);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrectSound();
    else {
      playWrongSound();
      addError({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subject: 'math',
        expression: current.question.expression,
        correctAnswer: current.question.correctAnswer,
        userAnswer: answerNum,
        operation: current.question.operation === 'add' ? '加法' : '减法',
        difficulty: 'hard',
        mode: 'free',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        reviewCount: 0,
        mastered: false,
      });
    }

    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      setInput('');
      const isLast = test.index + 1 >= test.items.length;
      if (isLast) {
        const finalTest = { ...test, correct: newCorrect, wrong: newWrong, answers: newAnswers };
        setTest(finalTest);
        finishTest(finalTest);
      } else {
        setTest({ ...test, index: test.index + 1, correct: newCorrect, wrong: newWrong, answers: newAnswers, questionStart: Date.now() });
      }
    }, isCorrect ? 500 : 1100);
  }, [test, input, finishTest]);

  const pressKey = (key: string) => {
    playClickSound();
    if (key === 'del') setInput((p) => p.slice(0, -1));
    else if (key === 'neg') setInput((p) => (p.startsWith('-') ? p.slice(1) : '-' + p));
    else if (key === 'ok') handleAnswer();
    else if (input.length < 5) setInput((p) => p + key);
  };

  // ── INTRO ──
  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5] to-[#F7F8FC]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-28">
          <button
            onClick={() => { playClickSound(); setCurrentView('summer-camp'); }}
            className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-white rounded-full px-3 py-2 mb-4 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 返回训练营
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl text-center mb-4"
          >
            <motion.div
              className="text-6xl mb-3"
              animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >🩺</motion.div>
            <h1 className="text-xl font-black text-gray-800 mb-1">
              {isPost ? '结营能力测评' : '入营能力诊断'}
            </h1>
            <p className="text-xs text-gray-400 mb-5">
              {isPost ? '检验 60 天训练成果' : '摸底测试，找出薄弱环节'}
            </p>

            <div className="bg-[#ECFDF5] rounded-2xl p-4 mb-4 text-left">
              <p className="text-xs font-bold text-[#10B981] mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> 测试说明
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-600 leading-relaxed">
                <p>📝 共 30 题，覆盖 5 个能力维度</p>
                <p>⏱️ 不限时，认真作答（预计 8-12 分钟）</p>
                <p>📊 测完生成能力报告 + 个性化建议</p>
              </div>
            </div>

            {/* 5 dimensions preview */}
            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {Object.entries(DIMENSION_INFO).map(([key, info]) => (
                <div key={key} className="bg-gray-50 rounded-xl py-2">
                  <div className="text-lg">{info.emoji}</div>
                  <p className="text-[8px] text-gray-500 font-medium mt-0.5 leading-tight">{info.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); startTest(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> 开始{isPost ? '测评' : '诊断'}
            </button>
          </motion.div>

          {!isPost && (
            <div className="bg-amber-50 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">诊断结果不会影响训练，只是为了找出孩子的真实水平，请鼓励孩子独立完成。</p>
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── RESULT ──
  if (stage === 'result' && test) {
    // 优先用本地缓存的结果，回退到 store，避免 store 更新时序导致 null
    const result = localResult ?? (isPost ? camp.diagnosticPost : camp.diagnosticPre);
    if (!result) {
      // 极端情况下仍未拿到结果，显示加载中
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-bounce">📊</div>
            <p className="text-sm text-gray-500">正在生成报告...</p>
          </div>
        </div>
      );
    }
    const totalTimeMs = Date.now() - test.startTime;
    const accuracy = result.accuracy;
    const isGood = accuracy >= 75;
    const isMid = accuracy >= 50;

    // weakest dimension
    const dimEntries = Object.entries(result.byDimension) as [DiagnosticDimension, { correct: number; total: number }][];
    const weakest = [...dimEntries].sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0];
    const strongest = [...dimEntries].sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))[0];

    // suggestions
    const suggestions: string[] = [];
    if (result.byDimension.add20.correct / result.byDimension.add20.total < 0.7) suggestions.push('20以内加法不熟，建议先复习凑十法');
    if (result.byDimension.sub20.correct / result.byDimension.sub20.total < 0.7) suggestions.push('20以内减法不熟，建议先复习破十法');
    if (result.byDimension.add100.correct / result.byDimension.add100.total < 0.7) suggestions.push('100以内进位加法需加强，注意进位的1');
    if (result.byDimension.sub100.correct / result.byDimension.sub100.total < 0.7) suggestions.push('100以内退位减法需加强，注意借位');
    if (result.avgTimeMs > 10000) suggestions.push('计算速度偏慢，需通过限时训练提速');
    if (suggestions.length === 0) suggestions.push('各维度掌握良好，可挑战更高难度与速度');

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5] to-[#F7F8FC]">
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
              {isGood ? '🏆' : isMid ? '👍' : '💪'}
            </motion.div>
            <h2 className="text-xl font-black text-gray-800 mb-1">
              {isPost ? '结营测评完成！' : '诊断完成！'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              {isGood ? '计算能力很棒！' : isMid ? '基础不错，继续提升' : '找准薄弱，开始突击'}
            </p>

            {/* Overall score */}
            <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 rounded-3xl p-5 mb-4">
              <p className="text-5xl font-black text-[#10B981] mb-1">{accuracy}<span className="text-2xl">%</span></p>
              <p className="text-xs text-gray-500">总正确率 · {result.totalCorrect}/{result.totalQuestions} 题</p>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimeChinese(totalTimeMs)}</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 均速 {Math.round(result.avgTimeMs / 1000)}s/题</span>
              </div>
            </div>

            {/* Pre/Post comparison */}
            {isPost && camp.diagnosticPre && (
              <div className="bg-[#F59E0B]/8 rounded-2xl p-3 mb-4 flex items-center justify-around">
                <div>
                  <p className="text-[10px] text-gray-400">入营前</p>
                  <p className="text-2xl font-black text-gray-500">{camp.diagnosticPre.accuracy}%</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <p className="text-[10px] text-gray-400">结营后</p>
                  <p className="text-2xl font-black text-[#10B981]">{accuracy}%</p>
                </div>
                <div className="bg-white rounded-xl px-3 py-1.5">
                  <p className="text-[10px] text-gray-400">提升</p>
                  <p className="text-lg font-black text-[#F59E0B]">+{Math.max(0, accuracy - camp.diagnosticPre.accuracy)}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* 5-dimension breakdown */}
          <div className="bg-white rounded-3xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#10B981]" /> 五维度能力分析
            </h3>
            <div className="space-y-3">
              {dimEntries.map(([dim, stats]) => {
                const info = DIMENSION_INFO[dim];
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={dim}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-600">{info.emoji} {info.label}</span>
                      <span className="font-bold" style={{ color: pct >= 70 ? info.color : '#EF4444' }}>
                        {stats.correct}/{stats.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: pct >= 70 ? info.color : '#EF4444' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px]">
              <span className="text-gray-400">💪 薄弱项：<b style={{ color: DIMENSION_INFO[weakest[0]].color }}>{DIMENSION_INFO[weakest[0]].label}</b></span>
              <span className="text-gray-400">🌟 强项：<b style={{ color: DIMENSION_INFO[strongest[0]].color }}>{DIMENSION_INFO[strongest[0]].label}</b></span>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-3xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#F59E0B]" /> 个性化建议
            </h3>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed">
                  <span className="text-[#F59E0B] font-bold mt-0.5">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { playClickSound(); setCurrentView('summer-camp'); }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" /> {isPost ? '查看训练营' : '开始 60 天训练'}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── TESTING ──
  if (!test) return null;
  const current = test.items[test.index];
  if (!current) return null;
  const progress = (test.index / test.items.length) * 100;
  const dimInfo = DIMENSION_INFO[current.dimension];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-white shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#10B981]">{isPost ? '结营测评' : '能力诊断'}</span>
            <span className="text-xs font-bold text-gray-600">{test.index + 1}/{test.items.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-[#10B981]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-gray-400">✓ {test.correct}  ✗ {test.wrong}</span>
            <span className="font-bold" style={{ color: dimInfo.color }}>{dimInfo.emoji} {dimInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          key={current.question.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center mb-8"
        >
          <p className="text-xs text-gray-400 mb-3">算一算</p>
          <div className="text-6xl font-black text-gray-800 tracking-wider">
            {current.question.expression} = <span className="text-[#10B981]">?</span>
          </div>
        </motion.div>

        <div className="mb-6 min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="fc" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2 text-[#10B981]">
                <CheckCircle2 className="w-12 h-12" />
                <span className="text-3xl font-black">{input}</span>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="fw" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2 text-[#EF4444]">
                <XCircle className="w-12 h-12" />
                <div>
                  <span className="text-2xl font-black line-through">{input}</span>
                  <p className="text-sm font-bold">正确：{current.question.correctAnswer}</p>
                </div>
              </motion.div>
            )}
            {!feedback && (
              <motion.div key="in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-5xl font-black ${input ? 'text-gray-800' : 'text-gray-300'}`}>
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
            className="h-14 rounded-2xl bg-[#10B981] text-white text-lg font-black active:scale-95 transition-transform shadow-md col-span-3"
          >
            确定 ✓
          </button>
        </div>
      </div>
    </div>
  );
}
