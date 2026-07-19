const ADJECTIVES = ['swift', 'calm', 'bold', 'bright', 'keen', 'warm', 'brave', 'clever'];
const NOUNS = ['otter', 'maple', 'harbor', 'ember', 'willow', 'falcon', 'meadow', 'river'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// e.g. "bold-falcon-72" — readable, easy to say aloud and type.
export function generateRoomCode(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(10 + Math.random() * 90)}`;
}

// Normalize typed codes so "Bold-Falcon-72" and " bold-falcon-72 " both work.
export function normalizeRoomCode(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}
