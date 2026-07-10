// 专项训练工具注册中心
// 统一管理三学科的专项训练工具，供各学科 Home 的「专项训练」Tab 使用
//
// 设计：
// - 每个工具是一个独立模块，有明确训练目标
// - 工具可复用现有组件（如暑期训练营、错题本）或独立页面
// - 通过 view 跳转，与现有路由系统兼容

import type { Subject } from '@/lib/game-store';

export interface SpecialTool {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  category: string;        // 分类（如"计算突击"、"拼音识记"）
  color: string;           // 主题色
  bg: string;              // 背景色
  view: string;            // 跳转 view
  badge?: string;          // 角标（如"HOT"、"新"）
  enabled: boolean;        // 是否启用（未实现的工具可置灰预告）
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
        enabled: true,
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
        enabled: true,
      },
      {
        id: 'mental-arithmetic',
        name: '口算速算训练',
        emoji: '🧮',
        desc: '1分钟限时口算 · 按题型专项突破',
        category: '计算突击',
        color: '#EF4444',
        bg: '#FEF2F2',
        view: 'special-mental-arithmetic',
        enabled: false, // 预告，后续实现
      },
    ],
  },
  {
    category: '查漏补缺',
    emoji: '🛡️',
    tools: [
      {
        id: 'error-book-practice',
        name: '错题强化训练',
        emoji: '📖',
        desc: '错题本按题型筛选 · 连对3次自动毕业',
        category: '查漏补缺',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        view: 'special-error-practice',
        enabled: false,
      },
      {
        id: 'weakness-targeted',
        name: '薄弱项专攻',
        emoji: '🎯',
        desc: '根据练习记录自动识别薄弱项 · 针对性训练',
        category: '查漏补缺',
        color: '#EC4899',
        bg: '#FDF2F8',
        view: 'special-weakness',
        enabled: false,
      },
    ],
  },
];

// ─── 语文专项训练工具 ────────────────────────────────────────────────────────

export const CHINESE_SPECIAL_TOOLS: SpecialToolGroup[] = [
  {
    category: '拼音识记',
    emoji: '🔤',
    tools: [
      {
        id: 'cn-pinyin',
        name: '拼音专项训练',
        emoji: '🔤',
        desc: '识拼音/写拼音 · 含声调训练',
        category: '拼音识记',
        color: '#E84393',
        bg: '#FFF0F6',
        view: 'special-cn-pinyin',
        enabled: false,
      },
      {
        id: 'cn-dictation',
        name: '听写训练',
        emoji: '✍️',
        desc: 'TTS 朗读词语 · 看图提示 · 自动判分',
        category: '拼音识记',
        color: '#F59E0B',
        bg: '#FFFBEB',
        view: 'special-cn-dictation',
        enabled: false,
      },
    ],
  },
  {
    category: '字词句篇',
    emoji: '📚',
    tools: [
      {
        id: 'cn-idiom-poetry',
        name: '成语古诗专项',
        emoji: '📜',
        desc: '成语填空 + 古诗填空 · 按年级分级',
        category: '字词句篇',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        view: 'special-cn-idiom',
        enabled: false,
      },
      {
        id: 'cn-sentence',
        name: '句子训练',
        emoji: '📝',
        desc: '句子填空 + 排序 + 仿句',
        category: '字词句篇',
        color: '#06B6D4',
        bg: '#ECFEFF',
        view: 'special-cn-sentence',
        enabled: false,
      },
    ],
  },
];

// ─── 英语专项训练工具 ────────────────────────────────────────────────────────

export const ENGLISH_SPECIAL_TOOLS: SpecialToolGroup[] = [
  {
    category: '词汇听力',
    emoji: '👂',
    tools: [
      {
        id: 'en-vocab',
        name: '词汇识记',
        emoji: '👀',
        desc: '看词选图/看图选词 · 建立词图联想',
        category: '词汇听力',
        color: '#00B894',
        bg: '#EFFEFA',
        view: 'special-en-vocab',
        enabled: false,
      },
      {
        id: 'en-listening',
        name: '听力训练',
        emoji: '👂',
        desc: 'TTS 朗读 + 选词 · 练就英语耳朵',
        category: '词汇听力',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        view: 'special-en-listening',
        enabled: false,
      },
    ],
  },
  {
    category: '拼写句型',
    emoji: '✏️',
    tools: [
      {
        id: 'en-spelling',
        name: '拼写达人',
        emoji: '⌨️',
        desc: '看图/听音拼写单词 · 自然拼读法',
        category: '拼写句型',
        color: '#EF4444',
        bg: '#FEF2F2',
        view: 'special-en-spelling',
        enabled: false,
      },
      {
        id: 'en-dialogue',
        name: '句型对话',
        emoji: '💬',
        desc: '日常对话句型训练 · 情景对话',
        category: '拼写句型',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        view: 'special-en-dialogue',
        enabled: false,
      },
    ],
  },
];

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

// 统计已启用的工具数
export function getEnabledToolCount(subject: Subject): number {
  return getSpecialTools(subject).reduce(
    (sum, g) => sum + g.tools.filter((t) => t.enabled).length,
    0
  );
}

// 统计总工具数
export function getTotalToolCount(subject: Subject): number {
  return getSpecialTools(subject).reduce((sum, g) => sum + g.tools.length, 0);
}
