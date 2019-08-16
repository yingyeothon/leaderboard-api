import elapsed from "../system/elapsed";
import logger from "../system/logger";
import { lowerBound } from "../utils/collection";
import { IRankDocument } from "./document";
import { compareNumbers, numbersEqual, scoreToNumbers } from "./score";

export const insertOrUpdateRank = elapsed(
  `insertOrUpdateRank`,
  (doc: IRankDocument, user: string, scoreOfStringFormat: string) => {
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
  }
);

export const isHigherThanOld = elapsed(
  `isHigherThanOld`,
  (doc: IRankDocument, user: string, scoreOfStringFormat: string) => {
    const index = doc.userIndex[user];
    if (index === undefined) {
      return true;
    }

    const newScore = scoreToNumbers(scoreOfStringFormat);
    const oldScore = doc.scores[index];
    return compareNumbers(oldScore, newScore) < 0;
  }
);

const clearPreviousRank = elapsed(
  `clearPreviousRank`,
  (doc: IRankDocument, user: string) => {
    const index = doc.userIndex[user];
    if (index === undefined) {
      return;
    }
    doc.users[index].splice(
      doc.users[index].findIndex(each => each === user),
      1
    );

    // If no users in that score, clear its entry, too.
    if (doc.users[index].length === 0) {
      doc.users.splice(index, 1);
      doc.scores.splice(index, 1);
      updateUserIndexAfter(doc, index);
    }
  }
);

const updateUserIndexAfter = elapsed(
  `updateUserIndexAfter`,
  (doc: IRankDocument, startIndex: number) => {
    for (let index = startIndex; index < doc.users.length; ++index) {
      for (const user of doc.users[index]) {
        doc.userIndex[user] = index;
      }
    }
  }
);
