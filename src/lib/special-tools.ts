// 专项训练工具注册中心
// 统一管理三学科的专项训练工具，供各学科 Home 的「专项训练」Tab 使用
//
// 设计：
// - 每个工具是一个独立模块，有明确训练目标
// - 工具可复用现有组件（如暑期训练营、错题本）或独立页面
// - 通过 view 跳转，与现有路由系统兼容
// - 只保留已上线的工具，未实现的工具不占位

import type { Subject } from '@/lib/game-store';

export interface SpecialTool {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  category: string;        // 分类（如"计算突击"）
  color: string;           // 主题色
  bg: string;              // 背景色
  view: string;            // 跳转 view
  badge?: string;          // 角标（如"HOT"）
}

export interface SpecialToolGroup {
  category: string;
  emoji: string;
  tools: SpecialTool[];
}

// ─── 数学专项训练工具 ────────────────────────────────────────────────────────

export const MATH_SPECIAL_TOOLS: SpecialToolGroup[] = [
  {
    category: '计算突击',
    emoji: '⚡',
    tools: [
      {
        id: 'summer-camp',
        name: '暑期突击训练营',
        emoji: '🏰',
        desc: '60天加减法系统突击 · 诊断+计划+技巧+周报',
        category: '计算突击',
        color: '#F59E0B',
        bg: '#FFF7ED',
        view: 'summer-camp',
        badge: 'HOT',
      },
      {
        id: 'math-diagnostic',
        name: '计算能力诊断',
        emoji: '🩺',
        desc: '5维度能力测 · 20/100以内加减 · 出能力报告',
        category: '计算突击',
        color: '#10B981',
        bg: '#ECFDF5',
        view: 'summer-diagnostic',
      },
    ],
  },
];

// ─── 语文专项训练工具（暂未上线，保留接口） ──────────────────────────────────

export const CHINESE_SPECIAL_TOOLS: SpecialToolGroup[] = [];

// ─── 英语专项训练工具（暂未上线，保留接口） ──────────────────────────────────

export const ENGLISH_SPECIAL_TOOLS: SpecialToolGroup[] = [];

// ─── 统一获取 ────────────────────────────────────────────────────────────────

export function getSpecialTools(subject: Subject): SpecialToolGroup[] {
  switch (subject) {
    case 'math':
      return MATH_SPECIAL_TOOLS;
    case 'chinese':
      return CHINESE_SPECIAL_TOOLS;
    case 'english':
      return ENGLISH_SPECIAL_TOOLS;
    default:
      return [];
  }
}

// 统计已上线的工具数
export function getEnabledToolCount(subject: Subject): number {
  return getSpecialTools(subject).reduce((sum, g) => sum + g.tools.length, 0);
}

// 统计总工具数
export function getTotalToolCount(subject: Subject): number {
  return getEnabledToolCount(subject);
}
