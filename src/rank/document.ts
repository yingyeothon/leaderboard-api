export interface IRankDocument {
  scores: number[][];
  users: string[][];
  userIndex: { [user: string]: number };
}

export interface IRankRecord {
  rank: number;
  user: string;
  score: string;
}

export const emptyDocument = (): IRankDocument => ({
  scores: [],
  users: [],
  userIndex: {}
});
