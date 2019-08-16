import elapsed from "../system/elapsed";
import { reverse } from "../utils/collection";
import { IRankDocument, IRankRecord } from "./document";
import { numbersToScore } from "./score";

export const fetchRanksByOffset = elapsed(
  `fetchRanksByOffset`,
  (doc: IRankDocument, offset: number, limit: number): IRankRecord[] => {
    let start = offset;
    const records: IRankRecord[] = [];
    for (let index = 0; index < doc.users.length; ++index) {
      const users = doc.users[index];

      if (start >= users.length) {
        // There is lots of things to skip.
        start -= users.length;
      } else {
        // Collect things with converting.
        const score = numbersToScore(doc.scores[index]);
        Array.prototype.push.apply(
          records,
          reverse(users) // Descending by modified
            .slice(start, limit - records.length)
            .map(user => ({ rank: index + 1, user, score } as IRankRecord))
        );
        start = 0;
      }
    }
    return records;
  }
);

export const fetchMyRank = elapsed(
  `fetchMyRank`,
  (doc: IRankDocument, user: string): IRankRecord => {
    const index = doc.userIndex[user];
    if (index === undefined) {
      return undefined;
    }
    const score = numbersToScore(doc.scores[index]);
    const rank = index + 1;
    return { rank, user, score };
  }
);

export const fetchUserAroundRanks = elapsed(
  `fetchUserAroundRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    const me = fetchMyRank(doc, user);
    const sameButNewers = fetchUserSameButNewerRanks(doc, user, limit);
    const sameButOlders = fetchUserSameButOlderRanks(doc, user, limit);
    const highers = fetchUserHigherRanks(
      doc,
      user,
      limit - sameButNewers.length
    );
    const lowers = fetchUserLowerRanks(doc, user, limit - sameButOlders.length);

    const high = highers.concat(sameButNewers);
    const low = sameButOlders.concat(lowers);

    const highLimit = Math.floor(limit / 2);
    const lowLimit = Math.floor((limit - 1) / 2);
    return high
      .slice(
        Math.max(
          0,
          high.length - (highLimit + Math.max(0, lowLimit - low.length))
        )
      )
      .concat(me ? [me] : [])
      .concat(low.slice(0, lowLimit + Math.max(0, highLimit - high.length)));
  }
);

export const scrollUpRanks = elapsed(
  `scrollUpRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    const sameButNewers = fetchUserSameButNewerRanks(doc, user, limit);
    const highers = fetchUserHigherRanks(
      doc,
      user,
      limit - sameButNewers.length
    );
    return highers
      .concat(sameButNewers)
      .slice(highers.length + sameButNewers.length - limit);
  }
);

export const scrollDownRanks = elapsed(
  `scrollDownRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    const sameButOlders = fetchUserSameButOlderRanks(doc, user, limit);
    const lowers = fetchUserLowerRanks(doc, user, limit - sameButOlders.length);
    return sameButOlders.concat(lowers).slice(0, limit);
  }
);

const fetchUserSameButNewerRanks = elapsed(
  `fetchUserSameButNewerRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    if (limit <= 0) {
      return [];
    }
    const index = doc.userIndex[user];
    const score = numbersToScore(doc.scores[index]);
    const rank = index + 1;

    const users = reverse(doc.users[index]);
    const myIndex = users.indexOf(user);
    return users
      .slice(Math.max(0, myIndex - limit), myIndex)
      .map(each => ({ rank, user: each, score } as IRankRecord));
  }
);

const fetchUserSameButOlderRanks = elapsed(
  `fetchUserSameButOlderRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    if (limit <= 0) {
      return [];
    }
    const index = doc.userIndex[user];
    const score = numbersToScore(doc.scores[index]);
    const rank = index + 1;

    const users = reverse(doc.users[index]);
    const myIndex = users.indexOf(user);
    const olders = users
      .slice(myIndex + 1, Math.min(users.length, myIndex + limit + 1))
      .map(each => ({ rank, user: each, score } as IRankRecord));
    return olders;
  }
);

const fetchUserHigherRanks = elapsed(
  `fetchUserHigherRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    const records: IRankRecord[] = [];
    let remainCount = limit;
    let rankIndex = doc.userIndex[user] - 1;
    while (remainCount > 0 && rankIndex >= 0) {
      const score = numbersToScore(doc.scores[rankIndex]);
      const users = doc.users[rankIndex];

      for (
        let userIndex = 0;
        userIndex < users.length && remainCount > 0;
        ++userIndex
      ) {
        records.push({ rank: rankIndex + 1, user: users[userIndex], score });
        --remainCount;
      }
      --rankIndex;
    }
    return reverse(records);
  }
);

const fetchUserLowerRanks = elapsed(
  `fetchUserLowerRanks`,
  (doc: IRankDocument, user: string, limit: number) => {
    const records: IRankRecord[] = [];
    let remainCount = limit;
    let rankIndex = doc.userIndex[user] + 1;
    while (remainCount > 0 && rankIndex < doc.scores.length) {
      const score = numbersToScore(doc.scores[rankIndex]);
      const users = reverse(doc.users[rankIndex]);

      for (
        let userIndex = 0;
        userIndex < users.length && remainCount > 0;
        ++userIndex
      ) {
        records.push({ rank: rankIndex + 1, user: users[userIndex], score });
        --remainCount;
      }
      ++rankIndex;
    }
    return records;
  }
);
