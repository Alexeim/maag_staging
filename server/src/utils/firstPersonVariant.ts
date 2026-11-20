// «От первого лица» materials come in two variants:
// - "first-person": cards and the page show the linked author's noBgAvatar
//   portrait, and the author's name is prepended to the title;
// - "opinion" («мнение»): cards and the page show the material's own
//   imageUrl, and the title is shown as-is.
// Documents saved before the switch have no `variant` field — they are
// "first-person". Kept free of Firestore imports so read-only controllers
// can share it without loading the editorial controller.
export type FirstPersonVariant = 'first-person' | 'opinion';

export const normalizeFirstPersonVariant = (value: unknown): FirstPersonVariant =>
  value === 'opinion' ? 'opinion' : 'first-person';
