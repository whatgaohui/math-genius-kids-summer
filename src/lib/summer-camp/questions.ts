// 暑期训练营 — 精准题目生成器
// 根据训练焦点（focus）生成受控的题目，精确控制进位/退位与数字范围

import type { MathQuestion } from '@/lib/math-utils';
import type { QuestionFocus } from './plan';
import { getPendingReviews } from '@/lib/error-book';

// ─── Helpers ────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  if (max < min) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _id = 0;
function genId(): string {
  return `camp-${Date.now()}-${++_id}`;
}

function mkAdd(num1: number, num2: number): MathQuestion {
  return {
    id: genId(),
    num1, num2,
    operation: 'add',
    correctAnswer: num1 + num2,
    displayOp: '+',
    expression: `${num1} + ${num2}`,
  };
}

function mkSub(num1: number, num2: number): MathQuestion {
  return {
    id: genId(),
    num1, num2,
    operation: 'subtract',
    correctAnswer: num1 - num2,
    displayOp: '−',
    expression: `${num1} − ${num2}`,
  };
}

// ─── Focus-specific generators ──────────────────────────────────────────────

// 10以内加法（sum <= 10）
function genAdd10(): MathQuestion {
  const num1 = randInt(0, 10);
  const num2 = randInt(0, 10 - num1);
  return mkAdd(num1, num2);
}

// 10以内减法
function genSub10(): MathQuestion {
  const num1 = randInt(1, 10);
  const num2 = randInt(0, num1);
  return mkSub(num1, num2);
}

// 9+几 进位加法（9+2 ~ 9+9）
function genAddCarry9(): MathQuestion {
  const num2 = randInt(2, 9);
  return mkAdd(9, num2);
}

// 8+几、7+几、6+几 进位加法
function genAddCarry8(): MathQuestion {
  const base = pick([8, 7, 6]);
  // 保证进位：num2 >= 11 - base
  const num2 = randInt(11 - base, 9);
  return mkAdd(base, num2);
}

// 20以内综合进位加法（两数1-9，和>=11）
function genAddCarry20(): MathQuestion {
  const num1 = randInt(2, 9);
  const num2 = randInt(11 - num1, 9);
  return mkAdd(num1, num2);
}

// 20以内退位减法（11-19 减 2-9，个位不够减）
function genSubBorrow20(): MathQuestion {
  const tens = randInt(1, 1); // 十位为1
  const ones = randInt(1, 9);
  const num1 = tens * 10 + ones; // 11-19
  const num2 = randInt(ones + 1, 9); // 个位不够减
  return mkSub(num1, num2);
}

// 20以内加减混合（含进位+退位+普通）
function genMix20(): MathQuestion {
  const r = Math.random();
  if (r < 0.5) return genAddCarry20();
  return genSubBorrow20();
}

// 20以内提速（更多普通题混入，更均衡）
function genMix20Speed(): MathQuestion {
  const r = Math.random();
  if (r < 0.3) {
    // 普通加法
    const a = randInt(0, 10);
    const b = randInt(0, 10 - a);
    return mkAdd(a, b);
  }
  if (r < 0.55) {
    // 普通减法
    const a = randInt(1, 10);
    const b = randInt(0, a);
    return mkSub(a, b);
  }
  if (r < 0.78) return genAddCarry20();
  return genSubBorrow20();
}

// 100以内不进位加法
function genAdd100NoCarry(): MathQuestion {
  const t1 = randInt(1, 8);
  const t2 = randInt(1, 9 - t1);
  const o1 = randInt(0, 8);
  const o2 = randInt(0, 9 - o1);
  const num1 = t1 * 10 + o1;
  const num2 = t2 * 10 + o2;
  return mkAdd(num1, num2);
}

// 100以内不退位减法
function genSub100NoBorrow(): MathQuestion {
  const t1 = randInt(1, 9);
  const o1 = randInt(0, 9);
  const num1 = t1 * 10 + o1;
  const t2 = randInt(0, t1);
  // 十位相等时个位要 <= o1
  const o2 = t2 === t1 ? randInt(0, o1) : randInt(0, 9);
  const num2 = t2 * 10 + o2;
  if (num2 === 0) return genSub100NoBorrow();
  return mkSub(num1, num2);
}

// 100以内进位加法（个位和>=10，结果<=100）
function genAdd100Carry(): MathQuestion {
  const o1 = randInt(1, 9);
  const o2 = randInt(10 - o1, 9);
  const sumO = o1 + o2; // 10..18
  // 进位后十位和需 +1，保证结果<=100
  const t1 = randInt(1, 8);
  const t2 = randInt(1, 9 - t1 - 1); // 留出进位空间
  const num1 = t1 * 10 + o1;
  const num2 = t2 * 10 + o2;
  return mkAdd(num1, num2);
}

// 100以内退位减法（个位不够减）
function genSub100Borrow(): MathQuestion {
  const t1 = randInt(1, 9);
  const o1 = randInt(0, 8);
  const num1 = t1 * 10 + o1;
  const o2 = randInt(o1 + 1, 9);
  const t2 = randInt(0, t1 - 1); // 十位必须严格小于（因为借位后十位会减1）
  const num2 = t2 * 10 + o2;
  if (num2 === 0) return genSub100Borrow();
  return mkSub(num1, num2);
}

// 100以内加减混合
function genMix100(): MathQuestion {
  const r = Math.random();
  if (r < 0.25) return genAdd100NoCarry();
  if (r < 0.5) return genSub100NoBorrow();
  if (r < 0.75) return genAdd100Carry();
  return genSub100Borrow();
}

// 100以内提速
function genMix100Speed(): MathQuestion {
  return genMix100();
}

// 终极测评（100为主，混入20）
function genFinalTest(): MathQuestion {
  const r = Math.random();
  if (r < 0.2) return genMix20Speed();
  return genMix100();
}

// 错题复习：从错题本解析题目，不足则补 mix
function genErrorReview(count: number): MathQuestion[] {
  const pending = getPendingReviews().filter((e) => e.subject === 'math' && e.expression);
  const result: MathQuestion[] = [];
  // 解析错题表达式
  for (const err of pending) {
    if (!err.expression) continue;
    // 匹配 "12 + 5" 或 "12 − 5" 或 "12 - 5"
    const m = err.expression.match(/^(\d+)\s*([+\-−])\s*(\d+)$/);
    if (!m) continue;
    const num1 = parseInt(m[1], 10);
    const num2 = parseInt(m[3], 10);
    const op = m[2];
    if (op === '+') {
      result.push(mkAdd(num1, num2));
    } else {
      result.push(mkSub(num1, num2));
    }
    if (result.length >= count) break;
  }
  // 不足补 mix-100
  while (result.length < count) {
    result.push(genMix100());
  }
  return result.slice(0, count);
}

// ─── Main Entry ─────────────────────────────────────────────────────────────

const GENERATORS: Record<Exclude<QuestionFocus, 'error-review'>, () => MathQuestion> = {
  'add-10': genAdd10,
  'sub-10': genSub10,
  'add-carry-9': genAddCarry9,
  'add-carry-8': genAddCarry8,
  'add-carry-20': genAddCarry20,
  'sub-borrow-20': genSubBorrow20,
  'mix-20': genMix20,
  'mix-20-speed': genMix20Speed,
  'add-100-no-carry': genAdd100NoCarry,
  'sub-100-no-borrow': genSub100NoBorrow,
  'add-100-carry': genAdd100Carry,
  'sub-100-borrow': genSub100Borrow,
  'mix-100': genMix100,
  'mix-100-speed': genMix100Speed,
  'final-test': genFinalTest,
};

export function generateCampQuestions(focus: QuestionFocus, count: number): MathQuestion[] {
  if (focus === 'error-review') {
    return genErrorReview(count);
  }
  const gen = GENERATORS[focus];
  const result: MathQuestion[] = [];
  // 去重：避免连续完全相同的题
  let lastExpr = '';
  for (let i = 0; i < count; i++) {
    let q = gen();
    let tries = 0;
    while (q.expression === lastExpr && tries < 5) {
      q = gen();
      tries++;
    }
    lastExpr = q.expression || '';
    result.push(q);
  }
  return result;
}

// ─── 诊断测题目（5维度各6题，共30题） ────────────────────────────────────────

export type DiagnosticDimension = 'add20' | 'sub20' | 'add100' | 'sub100' | 'speed';

export interface DiagnosticQuestion {
  question: MathQuestion;
  dimension: DiagnosticDimension;
  dimensionLabel: string;
}

// 带维度标签的诊断题（不打乱，便于按维度统计）
export function generateDiagnosticTagged(): DiagnosticQuestion[] {
  const result: DiagnosticQuestion[] = [];
  // 20以内加法 6题
  for (let i = 0; i < 6; i++) result.push({ question: genAddCarry20(), dimension: 'add20', dimensionLabel: '20以内加法' });
  // 20以内减法 6题
  for (let i = 0; i < 6; i++) result.push({ question: genSubBorrow20(), dimension: 'sub20', dimensionLabel: '20以内减法' });
  // 100以内加法 6题（含进位）
  for (let i = 0; i < 6; i++) {
    result.push({ question: Math.random() < 0.5 ? genAdd100Carry() : genAdd100NoCarry(), dimension: 'add100', dimensionLabel: '100以内加法' });
  }
  // 100以内减法 6题（含退位）
  for (let i = 0; i < 6; i++) {
    result.push({ question: Math.random() < 0.5 ? genSub100Borrow() : genSub100NoBorrow(), dimension: 'sub100', dimensionLabel: '100以内减法' });
  }
  // 综合 6题
  for (let i = 0; i < 6; i++) result.push({ question: genMix100Speed(), dimension: 'speed', dimensionLabel: '综合速度' });
  // 打乱（保留维度标签）
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
