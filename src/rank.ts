import { ConsoleLogger } from "@yingyeothon/logger";
import {
  compareNumbers,
  numbersEqual,
  numbersToScore,
  scoreToNumbers
} from "./score";
import { reverse } from "./utils";

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

const logger = new ConsoleLogger(!!process.env.DEBUG ? `debug` : `info`);

const lowerBound = <T>(
  values: T[],
  target: T,
  compare: (a: T, b: T) => number
): number => {
  let l = 0;
  let r = values.length;
  while (l + 1 <= r) {
    const m = l + Math.floor((r - l) / 2);
    const comp = compare(values[m], target);
    if (comp < 0) {
      l = m + 1;
    } else {
      r = m;
    }
  }
  return l;
};

export const insertOrUpdateRank = (
  maybeDoc: IRankDocument,
  user: string,
  scoreOfStringFormat: string
) => {
  const doc = ensureDocument(maybeDoc);
  if (!isHigherThanOld(doc, user, scoreOfStringFormat)) {
    logger.debug(
      `insertOrUpdateRank`,
      `skipLowScore`,
      user,
      scoreOfStringFormat
    );
    return doc;
  }

  // Delete the previous record.
  clearPreviousRank(doc, user);

  // Add a new record.
  const score = scoreToNumbers(scoreOfStringFormat);
  const currentIndex = lowerBound(
    doc.scores,
    score,
    (a, b) => compareNumbers(b, a) // Descending order.
  );
  logger.debug(`insertOrUpdateRank`, doc, `current`, currentIndex);

  if (numbersEqual(doc.scores[currentIndex], score)) {
    // If a score already exists.
    doc.users[currentIndex].push(user);
    doc.userIndex[user] = currentIndex;
  } else {
    // It is a new score.
    doc.scores.splice(currentIndex, 0, score);
    doc.users.splice(currentIndex, 0, [user]);

    // Update all of userIndex after currentIndex.
    doc.userIndex[user] = currentIndex;
    updateUserIndexAfter(doc, currentIndex + 1);
  }
  return doc;
};

const isHigherThanOld = (
  maybeDoc: IRankDocument,
  user: string,
  scoreOfStringFormat: string
) => {
  const doc = ensureDocument(maybeDoc);
  const index = doc.userIndex[user];
  if (index === undefined) {
    return true;
  }

  const newScore = scoreToNumbers(scoreOfStringFormat);
  const oldScore = doc.scores[index];
  return compareNumbers(oldScore, newScore) < 0;
};

const clearPreviousRank = (doc: IRankDocument, user: string) => {
  const index = doc.userIndex[user];
  if (index === undefined) {
    return;
  }
  doc.users[index].splice(doc.users[index].findIndex(each => each === user), 1);

  // If no users in that score, clear its entry, too.
  if (doc.users[index].length === 0) {
    doc.users.splice(index, 1);
    doc.scores.splice(index, 1);
    updateUserIndexAfter(doc, index);
  }
};

const updateUserIndexAfter = (doc: IRankDocument, startIndex: number) => {
  for (let index = startIndex; index < doc.users.length; ++index) {
    for (const user of doc.users[index]) {
      doc.userIndex[user] = index;
    }
  }
};

export const fetchRanks = (
  maybeDoc: IRankDocument,
  offset: number,
  count: number
): IRankRecord[] => {
  const doc = ensureDocument(maybeDoc);

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
          .slice(start, count - records.length)
          .map(user => ({ rank: index + 1, user, score } as IRankRecord))
      );
      start = 0;
    }
  }
  return records;
};

export const fetchUserRank = (
  maybeDoc: IRankDocument,
  user: string,
  contextMargin: number
): IRankRecord[] => {
  const doc = ensureDocument(maybeDoc);
  const currentIndex = doc.userIndex[user];
  if (currentIndex === undefined) {
    console.error(`No ranked user`, user);
    return [];
  }
  logger.debug(`fetchUserRank`, `document`, doc);

  const upper = fetchUserUpperRanks(doc, user, contextMargin);
  const me = fetchMyRank(doc, user);
  const same = fetchUserSameRanks(doc, user, contextMargin);
  const lower = fetchUserLowerRanks(doc, user, contextMargin - same.length);
  logger.debug(`fetchUserRank`, `upper`, upper);
  logger.debug(`fetchUserRank`, `same`, same);
  logger.debug(`fetchUserRank`, `lower`, lower);

  return [upper, [me], same, lower].reduce((a, b) => a.concat(b), []);
};

const fetchUserUpperRanks = (
  doc: IRankDocument,
  user: string,
  count: number
) => {
  const records: IRankRecord[] = [];
  let remainCount = count;
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
};

export const fetchMyRank = (
  maybeDoc: IRankDocument,
  user: string
): IRankRecord => {
  const doc = ensureDocument(maybeDoc);
  const index = doc.userIndex[user];
  if (index === undefined) {
    return undefined;
  }
  const score = numbersToScore(doc.scores[index]);
  const rank = index + 1;
  return { rank, user, score };
};

const fetchUserSameRanks = (
  doc: IRankDocument,
  user: string,
  count: number
) => {
  const index = doc.userIndex[user];
  const score = numbersToScore(doc.scores[index]);
  const rank = index + 1;
  const records: IRankRecord[] = [];
  {
    const users = doc.users[index];
    Array.prototype.push.apply(
      records,
      reverse(users)
        .filter(each => each !== user)
        .slice(0, count)
        .map(each => ({ rank, user: each, score } as IRankRecord))
    );
  }
  return records;
};

const fetchUserLowerRanks = (
  doc: IRankDocument,
  user: string,
  count: number
) => {
  const records: IRankRecord[] = [];
  let remainCount = count;
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
};

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
