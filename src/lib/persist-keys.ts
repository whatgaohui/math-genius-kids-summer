// 全部 zustand persist / 手动持久化的 localStorage 键集中管理。
// 设置页"清除数据"与顶层 ErrorBoundary 重置必须清同一份清单，避免两处各自维护导致漏清。
export const PERSISTED_KEYS = [
  'math-genius-game-store',
  'math-genius-pet-store',
  'math-genius-onboarding',
  'math-genius-learning-goals',
  'math-genius-leaderboard-prefs',
  'summer-camp-store',
  'error-book',
] as const;

export function clearAllPersistedData(): void {
  if (typeof window === 'undefined') return;
  for (const key of PERSISTED_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // 某些浏览器隐私模式下 removeItem 可能抛错，逐键忽略
    }
  }
}
