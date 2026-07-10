// 暑期训练营 — 状态管理
// 持久化训练进度、诊断结果、技巧学习、每日完成情况

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillKey } from './summer-camp/plan';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DayRecord {
  day: number;
  date: string;              // ISO date
  baseCorrect: number;
  baseTotal: number;
  baseTimeMs: number;
  speedCorrect: number;
  speedTotal: number;
  speedTimeMs: number;
  accuracy: number;          // 0-100
  avgTimeMs: number;         // 平均每题用时
  stars: number;             // 0-3
  completed: boolean;
}

export interface DiagnosticResult {
  date: string;
  totalCorrect: number;
  totalQuestions: number;
  totalTimeMs: number;
  accuracy: number;
  avgTimeMs: number;
  // 五维度正确数
  byDimension: {
    add20: { correct: number; total: number };
    sub20: { correct: number; total: number };
    add100: { correct: number; total: number };
    sub100: { correct: number; total: number };
    speed: { correct: number; total: number };
  };
}

export interface SkillProgress {
  key: SkillKey;
  learned: boolean;
  practiceCorrect: number;
  practiceTotal: number;
}

interface SummerCampState {
  // 计划
  enrolled: boolean;             // 是否已加入训练营
  startDate: string | null;      // 计划开始日期
  childName: string;             // 孩子姓名
  childGrade: string;            // 年级描述

  // 进度
  completedDays: Record<number, DayRecord>;
  currentDay: number;            // 当前应训练的天数 (1-60)

  // 诊断
  diagnosticPre: DiagnosticResult | null;
  diagnosticPost: DiagnosticResult | null;

  // 技巧
  skillProgress: Record<string, SkillProgress>;

  // 周报已查看
  lastReportWeek: number;

  // ── Actions ──
  enroll: (childName: string, childGrade: string) => void;
  unenroll: () => void;
  recordDay: (record: DayRecord) => void;
  setDiagnosticPre: (result: DiagnosticResult) => void;
  setDiagnosticPost: (result: DiagnosticResult) => void;
  markSkillLearned: (key: SkillKey) => void;
  recordSkillPractice: (key: SkillKey, correct: number, total: number) => void;
  setLastReportWeek: (week: number) => void;
  resetCamp: () => void;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_SKILLS: Record<string, SkillProgress> = {
  'make-ten': { key: 'make-ten', learned: false, practiceCorrect: 0, practiceTotal: 0 },
  'break-ten': { key: 'break-ten', learned: false, practiceCorrect: 0, practiceTotal: 0 },
  'carry-add': { key: 'carry-add', learned: false, practiceCorrect: 0, practiceTotal: 0 },
  'borrow-sub': { key: 'borrow-sub', learned: false, practiceCorrect: 0, practiceTotal: 0 },
  'mental-100': { key: 'mental-100', learned: false, practiceCorrect: 0, practiceTotal: 0 },
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSummerCampStore = create<SummerCampState>()(
  persist(
    (set) => ({
      enrolled: false,
      startDate: null,
      childName: '',
      childGrade: '',
      completedDays: {},
      currentDay: 1,
      diagnosticPre: null,
      diagnosticPost: null,
      skillProgress: { ...DEFAULT_SKILLS },
      lastReportWeek: 0,

      enroll: (childName, childGrade) =>
        set({
          enrolled: true,
          startDate: new Date().toISOString().split('T')[0],
          childName,
          childGrade,
          completedDays: {},
          currentDay: 1,
          diagnosticPre: null,
          diagnosticPost: null,
          skillProgress: { ...DEFAULT_SKILLS },
          lastReportWeek: 0,
        }),

      unenroll: () =>
        set({
          enrolled: false,
          startDate: null,
          childName: '',
          childGrade: '',
          completedDays: {},
          currentDay: 1,
          diagnosticPre: null,
          diagnosticPost: null,
        }),

      recordDay: (record) =>
        set((s) => {
          const completedDays = { ...s.completedDays, [record.day]: record };
          // 自动推进 currentDay：找第一个未完成的天
          let nextDay = s.currentDay;
          while (nextDay <= 60 && completedDays[nextDay]?.completed) {
            nextDay++;
          }
          return { completedDays, currentDay: Math.min(nextDay, 60) };
        }),

      setDiagnosticPre: (result) => set({ diagnosticPre: result }),
      setDiagnosticPost: (result) => set({ diagnosticPost: result }),

      markSkillLearned: (key) =>
        set((s) => ({
          skillProgress: {
            ...s.skillProgress,
            [key]: { ...(s.skillProgress[key] || { key, learned: false, practiceCorrect: 0, practiceTotal: 0 }), learned: true },
          },
        })),

      recordSkillPractice: (key, correct, total) =>
        set((s) => {
          const prev = s.skillProgress[key] || { key, learned: false, practiceCorrect: 0, practiceTotal: 0 };
          return {
            skillProgress: {
              ...s.skillProgress,
              [key]: {
                ...prev,
                practiceCorrect: prev.practiceCorrect + correct,
                practiceTotal: prev.practiceTotal + total,
              },
            },
          };
        }),

      setLastReportWeek: (week) => set({ lastReportWeek: week }),

      resetCamp: () =>
        set({
          enrolled: false,
          startDate: null,
          childName: '',
          childGrade: '',
          completedDays: {},
          currentDay: 1,
          diagnosticPre: null,
          diagnosticPost: null,
          skillProgress: { ...DEFAULT_SKILLS },
          lastReportWeek: 0,
        }),
    }),
    {
      name: 'summer-camp-store',
    }
  )
);

// ─── Selectors / Helpers ────────────────────────────────────────────────────

export function getCompletedDayCount(state: SummerCampState): number {
  return Object.values(state.completedDays).filter((d) => d.completed).length;
}

export function getTotalAccuracy(state: SummerCampState): number {
  const records = Object.values(state.completedDays).filter((d) => d.completed);
  if (records.length === 0) return 0;
  const totalAcc = records.reduce((sum, r) => sum + r.accuracy, 0);
  return Math.round(totalAcc / records.length);
}

export function getTotalQuestions(state: SummerCampState): number {
  return Object.values(state.completedDays).reduce(
    (sum, r) => sum + (r.baseTotal + r.speedTotal),
    0
  );
}

// 计算从开营到今天的连续打卡天数
export function getStreakDays(state: SummerCampState): number {
  if (!state.startDate) return 0;
  const records = Object.values(state.completedDays).filter((d) => d.completed);
  if (records.length === 0) return 0;
  // 简单连续：从最近一天往回数
  const days = records.map((r) => r.day).sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] - 1) streak++;
    else break;
  }
  return streak;
}

// 当前周次（1-9，约60天分9周）
export function getCurrentWeek(state: SummerCampState): number {
  const completed = getCompletedDayCount(state);
  return Math.floor(completed / 7) + 1;
}
