/**
 * MedAI XP & Leveling Logic
 */

export const XP_RUBRIC = {
  FLASHCARD_GOOD: 10,
  FLASHCARD_EASY: 20,
  QUIZ_CORRECT: 50,
  QUIZ_PERFECT_BONUS: 200,
  PATIENT_CASE_BASE: 100,
  MODULE_COMPLETION: 500,
};

/**
 * Calculate Level from XP
 * Level 1: 0 - 999 XP
 * Level 2: 1000 - 1999 XP
 * etc.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

/**
 * Calculate XP progress for the current level (0-100)
 */
export function calculateLevelProgress(xp: number): number {
  return (xp % 1000) / 10;
}

/**
 * Get XP required for the next level
 */
export function getXPForNextLevel(xp: number): number {
  return 1000 - (xp % 1000);
}
