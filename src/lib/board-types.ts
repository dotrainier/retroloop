export interface RoomUser {
  socketId: string;
  name: string;
  color: string;
}

export interface CursorInfo {
  name: string;
  color: string;
  x: number; // 0–1 fraction of the canvas
  y: number; // 0–1 fraction of the canvas
}

export interface Note {
  id: string;
  text: string;
  color: string;
  authorName: string;
  x: number; // 0–1 fraction of the canvas
  y: number; // 0–1 fraction of the canvas
}

export interface Identity {
  name: string;
  color: string;
}

export interface OrganizeCluster {
  label: string;
  noteIds: string[];
}

export interface OrganizeResult {
  summary: string;
  clusters: OrganizeCluster[];
}
