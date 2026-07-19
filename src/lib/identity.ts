import type { Identity } from './board-types';

const IDENTITY_KEY = 'retroloop-identity';

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

// Read a saved identity from localStorage, or fall back to a random guest.
// SSR-safe: on the server there's no localStorage, so it returns a random one
// (which is fine — the board only renders this after mount on the client).
export function loadIdentity(): Identity {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Identity>;
        if (parsed.name && parsed.color) {
          return { name: parsed.name, color: parsed.color };
        }
      }
    } catch {
      // ignore malformed storage
    }
  }
  return { name: randomName(), color: randomColor() };
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // localStorage can be disabled/blocked — degrade quietly
  }
}

// True only if the user has previously chosen/saved an identity.
export function hasStoredIdentity(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(IDENTITY_KEY) !== null;
  } catch {
    return false;
  }
}
