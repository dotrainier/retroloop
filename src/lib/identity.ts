export const NOTE_COLORS = [
  '#F3D06A', // butter
  '#F0A876', // peach
  '#A8C49B', // sage
  '#9DBFD6', // sky
  '#C3AEDA', // lilac
  '#E7A6B4', // rose
];

export function randomName(): string {
  return `Guest ${Math.floor(Math.random() * 1000)}`;
}

export function randomColor(): string {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

// Deterministic tilt derived from the note's id. IMPORTANT: this must be a
// pure function of the id (not Math.random), so every client renders the SAME
// note at the SAME angle — otherwise the board would look different per person.
export function rotationFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 900) / 100 - 4.5; // range roughly -4.5°..+4.5°
}

// Pick a scattered spot within a comfortable central band, leaving margin so
// notes don't collide with the top toolbar or bottom composer.
export function scatterPosition(): { x: number; y: number } {
  return {
    x: 0.08 + Math.random() * 0.62, // 0.08..0.70
    y: 0.16 + Math.random() * 0.5, //  0.16..0.66
  };
}
