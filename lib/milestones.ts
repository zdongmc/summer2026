export type Milestone = { books: number; label: string; reward: string; type: 'individual' | 'group'; icon?: string; cost?: string };

// Unlocked individually — socks at 5 books, Winky's toy at 10
export const INDIVIDUAL_MILESTONES: Milestone[] = [
  { books: 5,  label: 'Level 1', reward: 'Level 1 Prize!', type: 'individual' },
  { books: 10, label: 'Level 2', reward: 'Level 2 Prize!', type: 'individual' },
  { books: 15, label: 'Level 3', reward: 'Level 3 Prize!', type: 'individual' },
];

// Unlocked when EVERY girl reaches the threshold
export const GROUP_MILESTONES: Milestone[] = [
  { books: 12, label: 'Pool Party',       reward: 'Pool Party!',                  type: 'group', icon: '💦' },
  { books: 20, label: 'Arcade Day', reward: 'Arcade Day at Round 1!', type: 'group', icon: '🧸' },
];

export function nextMilestone(count: number): Milestone | null {
  return INDIVIDUAL_MILESTONES.find(m => m.books > count) ?? null;
}
