import elapsed from "../system/elapsed";
import { getRepository } from "../system/external";
import { emptyDocument, IRankDocument, IRankRecord } from "./document";
import {
  fetchMyRank,
  fetchRanksByOffset,
  fetchUserAroundRanks,
  scrollDownRanks,
  scrollUpRanks
} from "./fetch";
import { insertOrUpdateRank, isHigherThanOld } from "./update";

export interface IRankRepository {
  load(): Promise<void>;
  update(user: string, score: string): Promise<void>;
  truncate(): Promise<void>;

  me(user: string): IRankRecord;
  top(offset: number, limit: number): IRankRecord[];
  around(user: string, limit: number): IRankRecord[];
  scroll(user: string, direction: "up" | "down", limit: number): IRankRecord[];
}

class RankRepository implements IRankRepository {
  private document: IRankDocument = emptyDocument();

  constructor(private readonly documentKey: string) {}

  public async load() {
    const loadDocument = () =>
      getRepository().get<IRankDocument>(this.documentKey);
    this.document = ensureDocument(
      await elapsed(`loadDocument`, loadDocument)()
    );
  }

  public async update(user: string, score: string, commit: boolean = true) {
    const saveDocument = () =>
      getRepository().set(this.documentKey, this.document);
    const updateRank = async () => {
      this.document = insertOrUpdateRank(this.document, user, score);
      if (commit) {
        await elapsed(`saveDocument`, saveDocument)();
      }
    };
    await elapsed(`updateRank`, updateRank)();
  }

  public isUpdatable(user: string, score: string) {
    return isHigherThanOld(this.document, user, score);
  }

  public me(user: string): IRankRecord {
    return fetchMyRank(this.document, user);
  }

  public top(offset: number, limit: number): IRankRecord[] {
    return fetchRanksByOffset(this.document, offset, limit);
  }

  public around(user: string, limit: number): IRankRecord[] {
    if (!this.isRanker(user)) {
      console.error(`No ranked user`, user);
      return [];
    }
    return fetchUserAroundRanks(this.document, user, limit);
  }

  public scroll(
    user: string,
    direction: "up" | "down",
    limit: number
  ): IRankRecord[] {
    if (direction === "up") {
      return scrollUpRanks(this.document, user, limit);
    } else if (direction === "down") {
      return scrollDownRanks(this.document, user, limit);
    } else {
      throw new Error(`Invalid direction[${direction}]`);
    }
  }

  public async truncate() {
    return elapsed(`truncate`, () =>
      getRepository().delete(this.documentKey)
    )();
  }

  private isRanker(user: string) {
    return this.document.userIndex[user] !== undefined;
  }
}

export const getRankRepository = elapsed(
  `getRankSystem`,
  async (documentKey: string) => {
    const repository = new RankRepository(documentKey);
    await repository.load();
    return repository;
  }
);

const ensureDocument = (doc: IRankDocument): IRankDocument => {
  if (!doc || !doc.scores || !doc.users) {
    return { scores: [], users: [], userIndex: {} };
  }
  if (doc.scores.length !== doc.users.length) {
    throw new Error(
      `Broken document: Size mismatch [scores=${doc.scores.length} <> users=${
        doc.users.length
      }]`
    );
  }
  return doc;
};
