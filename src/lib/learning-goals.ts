'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LearningGoal {
  id: string;
  type: 'daily' | 'weekly';
  targetSessions: number;  // how many practice sessions
  targetQuestions: number; // how many questions to answer
  targetStars: number;     // how many stars to earn
  subject: 'all' | 'math' | 'chinese' | 'english';
  isActive: boolean;
}

// 单科目的进度桶；'all' 口径沿用顶层全局计数器
interface SubjectBucket {
  sessions: number;
  questions: number;
  stars: number;
}

type SubjectKey = 'math' | 'chinese' | 'english';
// 旧持久化数据没有分桶字段，允许缺键
type SubjectBuckets = Partial<Record<SubjectKey, SubjectBucket>>;

const EMPTY_BUCKET: SubjectBucket = { sessions: 0, questions: 0, stars: 0 };

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// 计算某日期所在周的周一（用于周进度重置判断）
function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysSinceMonday);
  return monday;
}

interface LearningGoalsState {
  goals: LearningGoal[];
  todayCompletedSessions: number;
  todayCompletedQuestions: number;
  todayEarnedStars: number;
  weekCompletedSessions: number;
  weekCompletedQuestions: number;
  weekEarnedStars: number;
  // 按科目分桶的进度（旧数据没有这两个字段时按空桶处理，'all' 口径不受影响）
  todayBySubject: SubjectBuckets;
  weekBySubject: SubjectBuckets;
  lastResetDate: string;
  lastWeekResetDate: string;

  // Actions
  addGoal: (goal: Omit<LearningGoal, 'id'>) => void;
  removeGoal: (id: string) => void;
  toggleGoal: (id: string) => void;
  // subject 传入时同时累计到对应科目桶；不传只累计全局
  updateGoalProgress: (sessions: number, questions: number, stars: number, subject?: SubjectKey) => void;
  // 检查日/周边界并重置过期进度；页面挂载时调用，避免跨天后显示昨天的数字
  refreshResets: () => void;
  resetDailyProgress: () => void;
  getGoalProgress: (goal: LearningGoal) => { current: number; target: number; percent: number };
}

export const useLearningGoalsStore = create<LearningGoalsState>()(
  persist(
    (set, get) => ({
      goals: [
        // Default goals
        {
          id: 'default-daily-sessions',
          type: 'daily',
          targetSessions: 3,
          targetQuestions: 0,
          targetStars: 0,
          subject: 'all',
          isActive: true,
        },
        {
          id: 'default-daily-stars',
          type: 'daily',
          targetSessions: 0,
          targetQuestions: 0,
          targetStars: 5,
          subject: 'all',
          isActive: true,
        },
      ],
      todayCompletedSessions: 0,
      todayCompletedQuestions: 0,
      todayEarnedStars: 0,
      weekCompletedSessions: 0,
      weekCompletedQuestions: 0,
      weekEarnedStars: 0,
      todayBySubject: {},
      weekBySubject: {},
      lastResetDate: getTodayStr(),
      lastWeekResetDate: getTodayStr(),

      addGoal: (goal) => set((s) => ({
        goals: [...s.goals, { ...goal, id: `goal-${Date.now()}` }],
      })),

      removeGoal: (id) => set((s) => ({
        goals: s.goals.filter(g => g.id !== id),
      })),

      toggleGoal: (id) => set((s) => ({
        goals: s.goals.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g),
      })),

      refreshResets: () => {
        const today = getTodayStr();
        const state = get();

        const dayChanged = state.lastResetDate !== today;
        const weekChanged = getMondayOf(today).getTime() > getMondayOf(state.lastWeekResetDate).getTime();
        if (!dayChanged && !weekChanged) return;

        set({
          ...(dayChanged ? {
            todayCompletedSessions: 0,
            todayCompletedQuestions: 0,
            todayEarnedStars: 0,
            todayBySubject: {},
          } : {}),
          ...(weekChanged ? {
            weekCompletedSessions: 0,
            weekCompletedQuestions: 0,
            weekEarnedStars: 0,
            weekBySubject: {},
          } : {}),
          lastResetDate: today,
          lastWeekResetDate: weekChanged ? today : state.lastWeekResetDate,
        });
      },

      updateGoalProgress: (sessions, questions, stars, subject) => {
        // 先处理日/周边界重置，再累计
        get().refreshResets();
        const state = get();

        const todayBySubject = { ...(state.todayBySubject ?? {}) };
        const weekBySubject = { ...(state.weekBySubject ?? {}) };
        if (subject) {
          const t = todayBySubject[subject] ?? EMPTY_BUCKET;
          todayBySubject[subject] = {
            sessions: t.sessions + sessions,
            questions: t.questions + questions,
            stars: t.stars + stars,
          };
          const w = weekBySubject[subject] ?? EMPTY_BUCKET;
          weekBySubject[subject] = {
            sessions: w.sessions + sessions,
            questions: w.questions + questions,
            stars: w.stars + stars,
          };
        }

        set({
          todayCompletedSessions: state.todayCompletedSessions + sessions,
          todayCompletedQuestions: state.todayCompletedQuestions + questions,
          todayEarnedStars: state.todayEarnedStars + stars,
          weekCompletedSessions: state.weekCompletedSessions + sessions,
          weekCompletedQuestions: state.weekCompletedQuestions + questions,
          weekEarnedStars: state.weekEarnedStars + stars,
          todayBySubject,
          weekBySubject,
        });
      },

      resetDailyProgress: () => set({
        todayCompletedSessions: 0,
        todayCompletedQuestions: 0,
        todayEarnedStars: 0,
        todayBySubject: {},
        lastResetDate: getTodayStr(),
      }),

      getGoalProgress: (goal) => {
        const state = get();
        let current = 0;
        let target = 0;

        // 指定科目的目标从对应桶取数；'all' 用全局计数
        const bucket = goal.subject !== 'all'
          ? (goal.type === 'daily' ? state.todayBySubject : state.weekBySubject)?.[goal.subject] ?? EMPTY_BUCKET
          : null;

        const pick = (bucketValue: number, globalValue: number) => (bucket ? bucketValue : globalValue);

        if (goal.type === 'daily') {
          if (goal.targetSessions > 0) {
            current = pick(bucket?.sessions ?? 0, state.todayCompletedSessions);
            target = goal.targetSessions;
          } else if (goal.targetQuestions > 0) {
            current = pick(bucket?.questions ?? 0, state.todayCompletedQuestions);
            target = goal.targetQuestions;
          } else if (goal.targetStars > 0) {
            current = pick(bucket?.stars ?? 0, state.todayEarnedStars);
            target = goal.targetStars;
          }
        } else {
          if (goal.targetSessions > 0) {
            current = pick(bucket?.sessions ?? 0, state.weekCompletedSessions);
            target = goal.targetSessions;
          } else if (goal.targetQuestions > 0) {
            current = pick(bucket?.questions ?? 0, state.weekCompletedQuestions);
            target = goal.targetQuestions;
          } else if (goal.targetStars > 0) {
            current = pick(bucket?.stars ?? 0, state.weekEarnedStars);
            target = goal.targetStars;
          }
        }

        return {
          current,
          target,
          percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0,
        };
      },
    }),
    {
      name: 'math-genius-learning-goals',
      partialize: (state) => ({
        goals: state.goals,
        todayCompletedSessions: state.todayCompletedSessions,
        todayCompletedQuestions: state.todayCompletedQuestions,
        todayEarnedStars: state.todayEarnedStars,
        weekCompletedSessions: state.weekCompletedSessions,
        weekCompletedQuestions: state.weekCompletedQuestions,
        weekEarnedStars: state.weekEarnedStars,
        todayBySubject: state.todayBySubject,
        weekBySubject: state.weekBySubject,
        lastResetDate: state.lastResetDate,
        lastWeekResetDate: state.lastWeekResetDate,
      }),
    }
  )
);
