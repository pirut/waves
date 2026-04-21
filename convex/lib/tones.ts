// tones.ts — server-side mirror of src/theme/tokens.ts#CAT_TONE.
//
// Used anywhere the server needs to know per-category hue (e.g., notification
// icons, emailed badges). The prototype README calls out that this mapping is
// "a single source of truth — replicate it exactly server-side".

export type CategoryId =
  | 'cleanup'
  | 'food'
  | 'garden'
  | 'elders'
  | 'tutor'
  | 'animals'
  | 'blood'
  | 'outreach'
  | 'repairs';

export const CAT_TONE: Record<CategoryId, number> = {
  cleanup: 195,
  food: 35,
  garden: 145,
  elders: 355,
  tutor: 260,
  animals: 75,
  blood: 20,
  outreach: 220,
  repairs: 300,
};
