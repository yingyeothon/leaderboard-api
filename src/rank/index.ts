import mem from "mem";
import elapsed from "../system/elapsed";
import { getRepository } from "../system/external";
import logger from "../system/logger";
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
  load(): Promise<this>;
  commit(): Promise<this>;
  truncate(): Promise<this>;

  update(user: string, score: string): void;

  me(user: string): IRankRecord;
  top(offset: number, limit: number): IRankRecord[];
  around(user: string, limit: number): IRankRecord[];
  scroll(user: string, direction: "up" | "down", limit: number): IRankRecord[];
}

class RankRepository implements IRankRepository {
  private document: IRankDocument = emptyDocument();

  constructor(private readonly documentKey: string) {}

  public async load() {
    logger.debug(`Load document with key[${this.documentKey}]`);
    this.document = ensureDocument(
      await elapsed(`loadDocument`, () =>
        getRepository().get<IRankDocument>(this.documentKey)
      )()
    );
    return this;
  }

  public async commit() {
    logger.debug(`Save document with key[${this.documentKey}]`);
    await elapsed(`saveDocument`, () =>
      getRepository().set(this.documentKey, this.document)
    )();
    return this;
  }

  public update(user: string, score: string) {
    elapsed(`updateRank`, () => {
      this.document = insertOrUpdateRank(this.document, user, score);
    })();
  }

  public async truncate() {
    await elapsed(`truncate`, () => getRepository().delete(this.documentKey))();
    return this;
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

  private isRanker(user: string) {
    return this.document.userIndex[user] !== undefined;
  }
}

export const getRankRepository = elapsed(
  `getRankSystem`,
  mem((documentKey: string) => new RankRepository(documentKey))
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
