'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Delete, Lightbulb,
  Play, Sparkles, Star, XCircle, GraduationCap,
} from 'lucide-react';
import { useSummerCampStore } from '@/lib/summer-camp-store';
import { useGameStore } from '@/lib/game-store';
import type { SkillKey } from '@/lib/summer-camp/plan';
import { generateCampQuestions } from '@/lib/summer-camp/questions';
import type { MathQuestion } from '@/lib/math-utils';
import { playClickSound, playCorrectSound, playWrongSound, resumeAudioContext } from '@/lib/sound';
import BottomNav from './BottomNav';

// ─── Skill Content ──────────────────────────────────────────────────────────

interface SkillContent {
  key: SkillKey;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  tagline: string;
  intro: string;
  steps: { title: string; detail: string; example?: string }[];
  example: { problem: string; solution: string[]; explain: string };
  practiceFocus: string;
  practiceCount: number;
}

const SKILLS: SkillContent[] = [
  {
    key: 'make-ten',
    name: '凑十法',
    emoji: '🤝',
    color: '#10B981',
    bg: '#ECFDF5',
    tagline: '加法提速的核心秘诀',
    intro: '凑十法是进位加法的基础。看到 9 想 1，看到 8 想 2，看到 7 想 3……把一个数拆出一部分凑成 10，再加剩下部分。',
    steps: [
      { title: '看大数', detail: '观察较大的数，想它凑到 10 还差几', example: '9 + 5 → 9 凑 10 还差 1' },
      { title: '拆小数', detail: '把较小的数拆成两部分，一部分给大数凑 10', example: '把 5 拆成 1 和 4' },
      { title: '凑十加余', detail: '大数凑成 10，再加上拆剩下的部分', example: '9 + 1 = 10，10 + 4 = 14' },
    ],
    example: {
      problem: '8 + 6 = ?',
      solution: ['8 凑 10 还差 2', '把 6 拆成 2 和 4', '8 + 2 = 10', '10 + 4 = 14'],
      explain: '所以 8 + 6 = 14',
    },
    practiceFocus: 'add-carry-20',
    practiceCount: 10,
  },
  {
    key: 'break-ten',
    name: '破十法',
    emoji: '🔨',
    color: '#F59E0B',
    bg: '#FFFBEB',
    tagline: '退位减法的不二法门',
    intro: '破十法是退位减法的基础。当个位不够减时，把被减数拆成 10 和几，先用 10 去减，再加剩下的部分。',
    steps: [
      { title: '看被减数', detail: '把被减数拆成 10 和几两部分', example: '12 拆成 10 和 2' },
      { title: '用 10 减', detail: '用 10 减去减数', example: '10 − 9 = 1' },
      { title: '加余数', detail: '把上一步的结果加上拆出的"几"', example: '1 + 2 = 3' },
    ],
    example: {
      problem: '15 − 8 = ?',
      solution: ['把 15 拆成 10 和 5', '10 − 8 = 2', '2 + 5 = 7'],
      explain: '所以 15 − 8 = 7',
    },
    practiceFocus: 'sub-borrow-20',
    practiceCount: 10,
  },
  {
    key: 'carry-add',
    name: '进位加法',
    emoji: '⬆️',
    color: '#EF4444',
    bg: '#FEF2F2',
    tagline: '100以内加法关键技能',
    intro: '个位相加满 10，要向十位进 1。这是 100 以内加法最易错的地方，关键是别忘了进上来的 1。',
    steps: [
      { title: '个位相加', detail: '先算个位上的两个数相加', example: '37 + 25 → 7 + 5 = 12' },
      { title: '满十进一', detail: '个位满 10，向十位进 1，个位写余数', example: '写 2，进 1' },
      { title: '十位相加', detail: '十位相加时记得加上进位的 1', example: '3 + 2 + 1 = 6' },
    ],
    example: {
      problem: '48 + 36 = ?',
      solution: ['个位：8 + 6 = 14，写 4 进 1', '十位：4 + 3 + 1(进位) = 8', '结果：84'],
      explain: '所以 48 + 36 = 84',
    },
    practiceFocus: 'add-100-carry',
    practiceCount: 10,
  },
  {
    key: 'borrow-sub',
    name: '退位减法',
    emoji: '⬇️',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    tagline: '100以内减法核心技能',
    intro: '个位不够减时，向十位借 1 当 10，再相减。借位后十位要减 1，这是最常出错的地方。',
    steps: [
      { title: '看个位', detail: '个位不够减时，向十位借 1 当 10', example: '52 − 27 → 2 不够减 7' },
      { title: '借十相减', detail: '借 10 后，个位变成 12 减 7', example: '12 − 7 = 5' },
      { title: '十位减一', detail: '十位因借出 1，要再减 1', example: '5 − 1 − 2 = 2' },
    ],
    example: {
      problem: '63 − 28 = ?',
      solution: ['个位 3 不够减 8，向十位借 1', '13 − 8 = 5', '十位：6 − 1(借出) − 2 = 3', '结果：35'],
      explain: '所以 63 − 28 = 35',
    },
    practiceFocus: 'sub-100-borrow',
    practiceCount: 10,
  },
  {
    key: 'mental-100',
    name: '100以内心算',
    emoji: '🧠',
    color: '#EC4899',
    bg: '#FDF2F8',
    tagline: '不进位加减的心算技巧',
    intro: '不进位、不退位的加减法，可以拆成"十位算+个位算"两步，从高位算起更方便心算。',
    steps: [
      { title: '拆数', detail: '把两个数拆成十位和个位', example: '34 + 12 → 30+4 和 10+2' },
      { title: '高位算起', detail: '先算十位，再算个位', example: '30 + 10 = 40，4 + 2 = 6' },
      { title: '合并', detail: '把两部分合起来', example: '40 + 6 = 46' },
    ],
    example: {
      problem: '76 − 23 = ?',
      solution: ['十位：7 − 2 = 5（即 50）', '个位：6 − 3 = 3', '合并：50 + 3 = 53'],
      explain: '所以 76 − 23 = 53',
    },
    practiceFocus: 'add-100-no-carry',
    practiceCount: 10,
  },
];

// ─── Practice Player ────────────────────────────────────────────────────────

function PracticePlayer({ skill, onDone }: { skill: SkillContent; onDone: (correct: number, total: number) => void }) {
  const [questions] = useState<MathQuestion[]>(() => generateCampQuestions(skill.practiceFocus as never, skill.practiceCount));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  const current = questions[index];

  const handleAnswer = useCallback(() => {
    const answerNum = parseInt(input, 10);
    if (isNaN(answerNum)) return;
    const isCorrect = answerNum === Number(current.correctAnswer);
    const newCorrect = correct + (isCorrect ? 1 : 0);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrectSound(); else playWrongSound();

    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      setInput('');
      const isLast = index + 1 >= questions.length;
      if (isLast) {
        onDone(newCorrect, questions.length);
      } else {
        setIndex(index + 1);
        setCorrect(newCorrect);
      }
    }, isCorrect ? 500 : 1100);
  }, [input, current, correct, index, questions.length, onDone]);

  const pressKey = (k: string) => {
    playClickSound();
    if (k === 'del') setInput((p) => p.slice(0, -1));
    else if (k === 'neg') setInput((p) => (p.startsWith('-') ? p.slice(1) : '-' + p));
    else if (k === 'ok') handleAnswer();
    else if (input.length < 5) setInput((p) => p + k);
  };

  const progress = (index / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <div className="px-4 pt-5 pb-3 bg-white shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold" style={{ color: skill.color }}>{skill.emoji} {skill.name} · 跟练</span>
            <span className="text-xs font-bold text-gray-600">{index + 1}/{questions.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: skill.color }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-gray-400">✓ {correct}</span>
            <span className="text-gray-400">本轮 {questions.length} 题</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div key={current.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="text-center mb-8">
          <p className="text-xs text-gray-400 mb-3">用刚学的方法算一算</p>
          <div className="text-6xl font-black text-gray-800 tracking-wider">
            {current.expression} = <span style={{ color: skill.color }}>?</span>
          </div>
        </motion.div>
        <div className="mb-6 min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="fc" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2" style={{ color: skill.color }}>
                <CheckCircle2 className="w-12 h-12" /><span className="text-3xl font-black">{input}</span>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="fw" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2 text-[#EF4444]">
                <XCircle className="w-12 h-12" />
                <div>
                  <span className="text-2xl font-black line-through">{input}</span>
                  <p className="text-sm font-bold">正确：{current.correctAnswer}</p>
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

      <div className="px-4 pb-6 bg-white">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'neg', '0', 'del'].map((k) => (
            <button key={k} onClick={() => pressKey(k)} className={`h-14 rounded-2xl text-xl font-black active:scale-95 transition-transform shadow-sm ${k === 'del' ? 'bg-gray-100 text-gray-500' : k === 'neg' ? 'bg-gray-100 text-gray-500 text-base' : 'bg-white text-gray-800'}`}>
              {k === 'del' ? <Delete className="w-5 h-5 mx-auto" /> : k === 'neg' ? '±' : k}
            </button>
          ))}
          <button onClick={() => pressKey('ok')} className="h-14 rounded-2xl text-white text-lg font-black active:scale-95 transition-transform shadow-md col-span-3" style={{ backgroundColor: skill.color }}>
            确定 ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SummerCampSkills() {
  const setCurrentView = useGameStore((s) => s.setCurrentView);
  const camp = useSummerCampStore();
  const markSkillLearned = useSummerCampStore((s) => s.markSkillLearned);
  const recordSkillPractice = useSummerCampStore((s) => s.recordSkillPractice);

  const [selected, setSelected] = useState<SkillContent | null>(null);
  const [practicing, setPracticing] = useState<SkillContent | null>(null);

  useEffect(() => {
    const h = () => resumeAudioContext();
    document.addEventListener('touchstart', h, { once: true });
    document.addEventListener('click', h, { once: true });
    return () => {
      document.removeEventListener('touchstart', h);
      document.removeEventListener('click', h);
    };
  }, []);

  // ── Practice mode ──
  if (practicing) {
    return (
      <PracticePlayer
        skill={practicing}
        onDone={(correct, total) => {
          recordSkillPractice(practicing.key, correct, total);
          setPracticing(null);
          // show result inline by staying on skill detail with practice done banner
        }}
      />
    );
  }

  // ── Skill detail ──
  if (selected) {
    const progress = camp.skillProgress[selected.key];
    const learnedPct = progress && progress.practiceTotal > 0 ? Math.round((progress.practiceCorrect / progress.practiceTotal) * 100) : 0;
    return (
      <div className="min-h-screen bg-[#F7F8FC]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-28">
          <button
            onClick={() => { playClickSound(); setSelected(null); }}
            className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-white rounded-full px-3 py-2 mb-4 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 技巧列表
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 shadow-xl mb-4 relative overflow-hidden" style={{ backgroundColor: selected.bg }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ backgroundColor: `${selected.color}10` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <motion.div className="text-5xl" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>{selected.emoji}</motion.div>
                <div>
                  <h1 className="text-xl font-black text-gray-800">{selected.name}</h1>
                  <p className="text-[11px] font-medium" style={{ color: selected.color }}>{selected.tagline}</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur rounded-2xl p-3">
                <p className="text-xs text-gray-600 leading-relaxed">{selected.intro}</p>
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: selected.color }} /> 三步掌握
            </h3>
            <div className="space-y-3">
              {selected.steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ backgroundColor: selected.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{s.title}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{s.detail}</p>
                    {s.example && (
                      <p className="text-[11px] mt-1 px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: selected.bg, color: selected.color }}>
                        {s.example}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: selected.color }} /> 例题演示
            </h3>
            <div className="text-center mb-3">
              <p className="text-3xl font-black text-gray-800">{selected.example.problem}</p>
            </div>
            <div className="space-y-2">
              {selected.example.solution.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: selected.color }}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-700 font-medium">{s}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm font-bold mt-3" style={{ color: selected.color }}>{selected.example.explain}</p>
          </div>

          {/* Practice stats */}
          {progress && progress.practiceTotal > 0 && (
            <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">跟练记录</p>
                  <p className="text-lg font-black" style={{ color: selected.color }}>{progress.practiceCorrect}/{progress.practiceTotal} 正确</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">正确率</p>
                  <p className="text-lg font-black" style={{ color: learnedPct >= 70 ? selected.color : '#EF4444' }}>{learnedPct}%</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              playClickSound();
              markSkillLearned(selected.key);
              setPracticing(selected);
            }}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ backgroundColor: selected.color, boxShadow: `0 8px 20px ${selected.color}40` }}
          >
            <Play className="w-4 h-4 fill-white" /> 跟练 {selected.practiceCount} 题
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Skill list ──
  const learnedCount = SKILLS.filter((s) => camp.skillProgress[s.key]?.learned).length;
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto max-w-md px-4 pt-5 pb-28">
        <button
          onClick={() => { playClickSound(); setCurrentView('summer-camp'); }}
          className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-white rounded-full px-3 py-2 mb-4 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回训练营
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#F59E0B] to-[#EF4444] rounded-3xl p-5 shadow-xl mb-4 text-white">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-black">计算技巧学院</h1>
              <p className="text-[11px] text-white/80">先学方法，再提速</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" animate={{ width: `${(learnedCount / SKILLS.length) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
            <span className="text-xs font-bold">{learnedCount}/{SKILLS.length}</span>
          </div>
          <p className="text-[10px] text-white/70 mt-1.5">已学 {learnedCount} 个技巧</p>
        </motion.div>

        <div className="space-y-3">
          {SKILLS.map((skill, i) => {
            const progress = camp.skillProgress[skill.key];
            const learned = progress?.learned;
            const practicePct = progress && progress.practiceTotal > 0 ? Math.round((progress.practiceCorrect / progress.practiceTotal) * 100) : 0;
            return (
              <motion.button
                key={skill.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playClickSound(); setSelected(skill); }}
                className="w-full bg-white rounded-3xl p-4 shadow-sm active:shadow-md transition-all flex items-center gap-3 text-left"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: skill.bg }}>
                  {skill.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-gray-800">{skill.name}</h3>
                    {learned && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: skill.color }} />}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{skill.tagline}</p>
                  {progress && progress.practiceTotal > 0 && (
                    <p className="text-[10px] mt-1" style={{ color: practicePct >= 70 ? skill.color : '#EF4444' }}>
                      跟练 {progress.practiceCorrect}/{progress.practiceTotal} · {practicePct}%
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 mt-4 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">建议按顺序学习：凑十法 → 破十法 → 进位加法 → 退位减法 → 100以内心算。每个技巧学完跟练，掌握后再学下一个。</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
