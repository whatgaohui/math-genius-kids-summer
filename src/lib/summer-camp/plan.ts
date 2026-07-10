// 暑期数学突击训练营 — 60天课程计划
// 针对 8 岁升三年级孩子，系统突击 20 以内 / 100 以内加减法
//
// 设计理念：诊断 → 分阶段 → 每日训练 → 错题强化 → 技巧教学 → 阶段测评

export type QuestionFocus =
  // 20以内基础
  | 'add-10'            // 10以内加法（信心建立）
  | 'sub-10'            // 10以内减法
  | 'add-carry-9'       // 9+几 进位加法（凑十法）
  | 'add-carry-8'       // 8+几、7+几 进位加法
  | 'add-carry-20'      // 20以内综合进位加法
  | 'sub-borrow-20'     // 20以内退位减法（破十法）
  | 'mix-20'            // 20以内加减混合
  // 100以内
  | 'add-100-no-carry'  // 100以内不进位加法
  | 'sub-100-no-borrow' // 100以内不退位减法
  | 'add-100-carry'     // 100以内进位加法
  | 'sub-100-borrow'    // 100以内退位减法
  | 'mix-100'           // 100以内加减混合
  // 综合冲刺
  | 'mix-20-speed'      // 20以内限时提速
  | 'mix-100-speed'     // 100以内限时提速
  | 'error-review'      // 错题复习（动态生成）
  | 'final-test';       // 综合测评

export type SkillKey =
  | 'make-ten'        // 凑十法
  | 'break-ten'       // 破十法
  | 'carry-add'       // 进位加法
  | 'borrow-sub'      // 退位减法
  | 'mental-100';     // 100以内心算

export interface DayPlan {
  day: number;            // 1-60
  phase: 1 | 2 | 3 | 4;
  title: string;          // 当天主题
  emoji: string;
  focus: QuestionFocus;   // 题目焦点
  count: number;          // 基础练习题量
  speedCount: number;     // 限时挑战题量
  speedSeconds: number;   // 限时秒数
  skill?: SkillKey;       // 关联技巧
  isTest?: boolean;       // 是否测评日
  tip: string;            // 当天小贴士
}

export interface PhaseInfo {
  phase: 1 | 2 | 3 | 4;
  name: string;
  emoji: string;
  range: string;       // "Day 1-10"
  color: string;       // 主题色
  bg: string;          // 背景色
  goal: string;        // 阶段目标
}

export const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    name: '基础巩固期',
    emoji: '🌱',
    range: 'Day 1-10',
    color: '#10B981',
    bg: '#ECFDF5',
    goal: '掌握凑十法、破十法，20以内加减法准确率达 90%',
  },
  {
    phase: 2,
    name: '提速突破期',
    emoji: '⚡',
    range: 'Day 11-20',
    color: '#F59E0B',
    bg: '#FFFBEB',
    goal: '20以内加减法提速，平均每题 < 5 秒',
  },
  {
    phase: 3,
    name: '百以内攻坚期',
    emoji: '🚀',
    range: 'Day 21-40',
    color: '#EF4444',
    bg: '#FEF2F2',
    goal: '攻克100以内进位加法、退位减法',
  },
  {
    phase: 4,
    name: '综合冲刺期',
    emoji: '🏆',
    range: 'Day 41-60',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    goal: '综合应用、速度极限、查漏补缺',
  },
];

// ─── 60天逐日计划 ────────────────────────────────────────────────────────────

const RAW_DAYS: Omit<DayPlan, 'day' | 'phase'>[] = [
  // ════════ 阶段1：基础巩固期 (Day 1-10) ════════
  { title: '10以内加法热身', emoji: '😊', focus: 'add-10', count: 15, speedCount: 20, speedSeconds: 60, skill: 'make-ten', tip: '先复习10以内加法，找回做题的感觉！' },
  { title: '10以内减法热身', emoji: '🙂', focus: 'sub-10', count: 15, speedCount: 20, speedSeconds: 60, skill: 'break-ten', tip: '减法是加法的逆运算，想想"几+几=几"就能算出来！' },
  { title: '凑十法初体验', emoji: '🎯', focus: 'add-carry-9', count: 15, speedCount: 15, speedSeconds: 75, skill: 'make-ten', tip: '9+2=？想：9和1凑成10，把2分成1和1，得11。' },
  { title: '9+几 专项突破', emoji: '🌟', focus: 'add-carry-9', count: 18, speedCount: 18, speedSeconds: 75, skill: 'make-ten', tip: '9加几，就用"凑十法"，得数个位比加数少1。' },
  { title: '8+几、7+几 进位', emoji: '✨', focus: 'add-carry-8', count: 18, speedCount: 18, speedSeconds: 80, skill: 'make-ten', tip: '8凑2，7凑3，6凑4，5凑5，记住凑十小伙伴！' },
  { title: '进位加法巩固', emoji: '💪', focus: 'add-carry-20', count: 18, speedCount: 18, speedSeconds: 80, skill: 'carry-add', tip: '看到进位加法，先想"凑十"，再算剩多少。' },
  { title: '破十法初体验', emoji: '🎯', focus: 'sub-borrow-20', count: 15, speedCount: 15, speedSeconds: 80, skill: 'break-ten', tip: '12-9=？想：10-9=1，1+2=3，所以12-9=3。' },
  { title: '退位减法专项', emoji: '🌟', focus: 'sub-borrow-20', count: 18, speedCount: 18, speedSeconds: 80, skill: 'borrow-sub', tip: '破十法：把被减数拆成10和几，先用10减。' },
  { title: '20以内加减混合', emoji: '🔀', focus: 'mix-20', count: 18, speedCount: 18, speedSeconds: 80, tip: '加法想凑十，减法想破十，方法用对就很快！' },
  { title: '阶段1 小测验', emoji: '📋', focus: 'mix-20', count: 20, speedCount: 20, speedSeconds: 90, isTest: true, tip: '小测验时间！放轻松，把这两天学的方法用上！' },

  // ════════ 阶段2：提速突破期 (Day 11-20) ════════
  { title: '进位加法提速', emoji: '⚡', focus: 'add-carry-20', count: 20, speedCount: 25, speedSeconds: 90, skill: 'carry-add', tip: '提速秘诀：看到题立即反应凑十，不用再掰手指！' },
  { title: '进位加法冲刺', emoji: '⚡', focus: 'add-carry-20', count: 20, speedCount: 25, speedSeconds: 85, skill: 'carry-add', tip: '熟能生巧，多做几组就能脱口而出！' },
  { title: '退位减法提速', emoji: '⚡', focus: 'sub-borrow-20', count: 20, speedCount: 25, speedSeconds: 90, skill: 'borrow-sub', tip: '减法提速：想"减9加1、减8加2、减7加3"。' },
  { title: '退位减法冲刺', emoji: '⚡', focus: 'sub-borrow-20', count: 20, speedCount: 25, speedSeconds: 85, skill: 'borrow-sub', tip: '破十法练熟后，看到12-9直接反应=3！' },
  { title: '20以内混合提速', emoji: '🔀', focus: 'mix-20-speed', count: 20, speedCount: 30, speedSeconds: 90, tip: '加减混合，看清符号再下笔！' },
  { title: '20以内极限挑战', emoji: '🔥', focus: 'mix-20-speed', count: 20, speedCount: 30, speedSeconds: 80, tip: '今天的限时挑战有点难，加油冲！' },
  { title: '错题大扫除', emoji: '🧹', focus: 'error-review', count: 15, speedCount: 20, speedSeconds: 80, tip: '把之前做错的题再练一遍，彻底搞定它们！' },
  { title: '易错题强化', emoji: '🛡️', focus: 'mix-20', count: 20, speedCount: 25, speedSeconds: 85, tip: '容易看错符号？做完检查一遍符号！' },
  { title: '阶段2 热身测', emoji: '📋', focus: 'mix-20', count: 20, speedCount: 20, speedSeconds: 90, tip: '明天大测，今天先热身找手感！' },
  { title: '阶段2 大测验', emoji: '📋', focus: 'mix-20-speed', count: 25, speedCount: 25, speedSeconds: 100, isTest: true, tip: '20以内加减法大测验！这是检验成果的时候！' },

  // ════════ 阶段3：百以内攻坚期 (Day 21-40) ════════
  { title: '100以内不进位加', emoji: '➕', focus: 'add-100-no-carry', count: 18, speedCount: 20, speedSeconds: 90, skill: 'mental-100', tip: '34+12=？个位加个位，十位加十位，不进位很轻松！' },
  { title: '不进位加巩固', emoji: '➕', focus: 'add-100-no-carry', count: 20, speedCount: 22, speedSeconds: 90, skill: 'mental-100', tip: '心算小窍门：先算十位，再算个位。' },
  { title: '100以内不退位减', emoji: '➖', focus: 'sub-100-no-borrow', count: 18, speedCount: 20, speedSeconds: 90, skill: 'mental-100', tip: '56-23=？十位减十位，个位减个位。' },
  { title: '不退位减巩固', emoji: '➖', focus: 'sub-100-no-borrow', count: 20, speedCount: 22, speedSeconds: 90, skill: 'mental-100', tip: '不退位减法，从高位算起更方便！' },
  { title: '进位加法登场', emoji: '🎯', focus: 'add-100-carry', count: 18, speedCount: 18, speedSeconds: 100, skill: 'carry-add', tip: '37+25=？个位7+5=12，进1，十位3+2+1=6，得62。' },
  { title: '进位加法突破', emoji: '💪', focus: 'add-100-carry', count: 20, speedCount: 20, speedSeconds: 100, skill: 'carry-add', tip: '进位加法：先算个位，满十向十位进1。' },
  { title: '进位加法巩固', emoji: '🌟', focus: 'add-100-carry', count: 20, speedCount: 20, speedSeconds: 95, skill: 'carry-add', tip: '别忘了进位的1，这是最容易出错的地方！' },
  { title: '退位减法登场', emoji: '🎯', focus: 'sub-100-borrow', count: 18, speedCount: 18, speedSeconds: 100, skill: 'borrow-sub', tip: '52-27=？个位2不够减，向十位借1当10，12-7=5，十位4-2=2，得25。' },
  { title: '退位减法突破', emoji: '💪', focus: 'sub-100-borrow', count: 20, speedCount: 20, speedSeconds: 100, skill: 'borrow-sub', tip: '退位减法：个位不够减，向十位借1当10。' },
  { title: '退位减法巩固', emoji: '🌟', focus: 'sub-100-borrow', count: 20, speedCount: 20, speedSeconds: 95, skill: 'borrow-sub', tip: '借位后十位要减1，别忘了！' },
  { title: '加减混合训练', emoji: '🔀', focus: 'mix-100', count: 20, speedCount: 20, speedSeconds: 100, tip: '看清是加还是减，再判断要不要进位/退位。' },
  { title: '混合巩固', emoji: '🔀', focus: 'mix-100', count: 20, speedCount: 22, speedSeconds: 100, tip: '综合训练，把进位退位的方法用熟练！' },
  { title: '错题回顾', emoji: '🧹', focus: 'error-review', count: 15, speedCount: 20, speedSeconds: 100, tip: '把100以内的错题再练一遍！' },
  { title: '进位加法提速', emoji: '⚡', focus: 'add-100-carry', count: 20, speedCount: 25, speedSeconds: 100, skill: 'carry-add', tip: '提速阶段：看到题就能反应出要不要进位。' },
  { title: '退位减法提速', emoji: '⚡', focus: 'sub-100-borrow', count: 20, speedCount: 25, speedSeconds: 100, skill: 'borrow-sub', tip: '提速阶段：看到个位不够减，立刻知道要退位。' },
  { title: '100以内混合提速', emoji: '⚡', focus: 'mix-100-speed', count: 20, speedCount: 25, speedSeconds: 100, tip: '混合提速，又快又准才是真功夫！' },
  { title: '易错题攻坚', emoji: '🛡️', focus: 'mix-100', count: 20, speedCount: 22, speedSeconds: 95, tip: '把进位退位易错的题再强化一遍！' },
  { title: '阶段3 热身测', emoji: '📋', focus: 'mix-100', count: 22, speedCount: 22, speedSeconds: 105, tip: '明天大测，今天先找手感！' },
  { title: '阶段3 大测验', emoji: '📋', focus: 'mix-100-speed', count: 25, speedCount: 25, speedSeconds: 110, isTest: true, tip: '100以内加减法大测验！检验攻坚成果！' },

  // ════════ 阶段4：综合冲刺期 (Day 41-60) ════════
  { title: '20以内极限速', emoji: '🔥', focus: 'mix-20-speed', count: 20, speedCount: 30, speedSeconds: 80, tip: '回到20以内，挑战极限速度！' },
  { title: '100以内综合', emoji: '🔀', focus: 'mix-100', count: 22, speedCount: 25, speedSeconds: 105, tip: '20和100混合，灵活切换！' },
  { title: '错题终极大扫除', emoji: '🧹', focus: 'error-review', count: 18, speedCount: 22, speedSeconds: 95, tip: '把整个暑假的错题都过一遍！' },
  { title: '进位加法大师', emoji: '👑', focus: 'add-100-carry', count: 22, speedCount: 28, speedSeconds: 100, skill: 'carry-add', tip: '做到看到题就有答案的条件反射！' },
  { title: '退位减法大师', emoji: '👑', focus: 'sub-100-borrow', count: 22, speedCount: 28, speedSeconds: 100, skill: 'borrow-sub', tip: '退位减法也能脱口而出！' },
  { title: '综合提速A', emoji: '⚡', focus: 'mix-100-speed', count: 22, speedCount: 28, speedSeconds: 100, tip: '综合提速训练，又快又准！' },
  { title: '综合提速B', emoji: '⚡', focus: 'mix-100-speed', count: 22, speedCount: 30, speedSeconds: 95, tip: '挑战更高速度，超越自己！' },
  { title: '易错题最后一击', emoji: '🛡️', focus: 'mix-100', count: 22, speedCount: 25, speedSeconds: 100, tip: '消灭最后的易错题！' },
  { title: '模拟测1', emoji: '📝', focus: 'mix-100', count: 25, speedCount: 25, speedSeconds: 110, isTest: true, tip: '模拟正式测验，检验综合水平！' },
  { title: '模拟测2', emoji: '📝', focus: 'mix-100-speed', count: 25, speedCount: 25, speedSeconds: 100, isTest: true, tip: '第二次模拟，看分数是否提升！' },
  { title: '弱点专攻', emoji: '🎯', focus: 'error-review', count: 20, speedCount: 25, speedSeconds: 100, tip: '根据模拟测结果，专攻薄弱环节！' },
  { title: '满分冲刺A', emoji: '🏆', focus: 'mix-100', count: 25, speedCount: 28, speedSeconds: 105, tip: '向满分发起冲击！' },
  { title: '满分冲刺B', emoji: '🏆', focus: 'mix-100-speed', count: 25, speedCount: 30, speedSeconds: 100, tip: '稳定发挥，向满分冲刺！' },
  { title: '终极热身', emoji: '🔥', focus: 'mix-100', count: 22, speedCount: 25, speedSeconds: 100, tip: '明天终极测评，今天最后热身！' },
  { title: '错题快练', emoji: '🧹', focus: 'error-review', count: 15, speedCount: 20, speedSeconds: 80, tip: '考前最后一遍错题复习！' },
  { title: '终极测评', emoji: '🏆', focus: 'final-test', count: 30, speedCount: 30, speedSeconds: 120, isTest: true, tip: '终极测评！60天的努力，今天见分晓！' },
  { title: '毕业典礼', emoji: '🎓', focus: 'mix-20', count: 15, speedCount: 20, speedSeconds: 70, isTest: true, tip: '恭喜毕业！做一组轻松题庆祝一下！' },
  { title: '荣誉殿堂', emoji: '🥇', focus: 'mix-100', count: 20, speedCount: 25, speedSeconds: 100, tip: '回顾暑假历程，你已是计算小达人！' },
];

// 给每一天补上 day 和 phase
function getPhaseByDay(day: number): 1 | 2 | 3 | 4 {
  if (day <= 10) return 1;
  if (day <= 20) return 2;
  if (day <= 40) return 3;
  return 4;
}

export const DAYS: DayPlan[] = RAW_DAYS.map((d, i) => ({
  ...d,
  day: i + 1,
  phase: getPhaseByDay(i + 1),
}));

export const TOTAL_DAYS = DAYS.length; // 60

export function getDayPlan(day: number): DayPlan | undefined {
  return DAYS.find((d) => d.day === day);
}

export function getPhaseInfo(phase: number): PhaseInfo | undefined {
  return PHASES.find((p) => p.phase === phase);
}

// 计算从 startDate 起今天是第几天（1-60，超出返回 60）
export function getCurrentDay(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(TOTAL_DAYS, diff + 1));
}

// 计算总训练题量（用于显示）
export function getTotalQuestions(): number {
  return DAYS.reduce((sum, d) => sum + d.count + d.speedCount, 0);
}
