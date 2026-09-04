// ═══════════════════════════════════════════════════════════════════════════════
// Modular Question Bank — Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────
// This module auto-registers all built-in question banks with the registry.
// Import this file once at app startup to initialize the entire question bank system.
//
// Usage:
//   import '@/lib/question-bank';  // Auto-registers all banks
//
//   // Then anywhere in the app:
//   import { QuestionBankRegistry } from '@/lib/question-bank';
//   const mathBank = QuestionBankRegistry.getBank('math');
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Core ─────────────────────────────────────────────────────────────────────
export { QuestionBankRegistry } from './registry';
export type {
  BaseQuestion,
  MathQuestion,
  ChineseQuestion,
  EnglishQuestion,
  AnyQuestion,
  QuestionBank,
  TopicMeta,
  GenerationOptions,
  BankRegistration,
  QuestionBankTemplate,
  QuestionBankTemplate as TemplateFile,
  TopicData,
  ValidationResult,
} from './types';

export type {
  ChineseMode,
  EnglishMode,
} from './types';

export type {
  Subject,
  Grade,
  Semester,
} from './types';

// ─── Math Bank ───────────────────────────────────────────────────────────────
export { registerMathBank, mathQuestionBank } from './math';

// ─── Chinese Bank ────────────────────────────────────────────────────────────
export { registerChineseBank, chineseBank } from './chinese';

// ─── English Bank ────────────────────────────────────────────────────────────
export { registerEnglishBank, englishBank } from './english';

// Registry needs to be in scope for the helpers below, not just re-exported
import { QuestionBankRegistry } from './registry';
import { registerMathBank } from './math';
import { registerChineseBank } from './chinese';
import { registerEnglishBank } from './english';

// ─── Auto-initialize all banks ───────────────────────────────────────────────
// This runs once when the module is first imported.

let _initialized = false;

/**
 * Initialize all built-in question banks.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initializeQuestionBanks(): void {
  if (_initialized) return;
  _initialized = true;

  registerMathBank();
  registerChineseBank();
  registerEnglishBank();
}

// Auto-initialize on module import
initializeQuestionBanks();

// ─── Convenience helpers ─────────────────────────────────────────────────────

/**
 * Generate questions for any subject/grade/semester.
 * This is the main API that game modes should call.
 */
import type { AnyQuestion, Subject, Grade, Semester, GenerationOptions } from './types';

export function generateQuestions(
  subject: Subject,
  grade: Grade,
  semester: Semester,
  count: number,
  options?: GenerationOptions & { topicId?: string; mode?: string },
): AnyQuestion[] {
  const bank = QuestionBankRegistry.getBank(subject);
  if (!bank) return [];

  if (options?.topicId) {
    return bank.generateTopicQuestions(grade, semester, options.topicId, count, options);
  }

  if (options?.mode && bank.generateModeQuestions) {
    return bank.generateModeQuestions(options.mode, grade, semester, count, options);
  }

  return bank.generateMixedQuestions(grade, semester, count, options);
}

/**
 * Get topic info for a specific subject/grade/semester combination.
 */
export function getTopics(
  subject: Subject,
  grade: Grade,
  semester: Semester,
): import('./types').TopicMeta[] {
  const bank = QuestionBankRegistry.getBank(subject);
  if (!bank) return [];

  const topicIds = bank.getTopicIds(grade, semester);
  return topicIds
    .map((id) => bank.getTopicInfo(id))
    .filter((info): info is import('./types').TopicMeta => !!info);
}
