import { emptyDocument, IRankDocument } from "../../src/rank/document";
import {
  fetchMyRank,
  fetchRanksByOffset,
  fetchUserAroundRanks,
  fetchUserAroundRanks as fetchAroundRanks,
  scrollDownRanks,
  scrollUpRanks
} from "../../src/rank/fetch";
import { insertOrUpdateRank } from "../../src/rank/update";
import { reverse } from "../../src/utils/collection";

const insertMany = (
  doc: IRankDocument,
  ...records: Array<{ user: string; score: string }>
) =>
  records.reduce(
    (acc, record) => insertOrUpdateRank(acc, record.user, record.score),
    doc
  );

test("add-one", () => {
  const user = "user1";
  const score = "123456789123456789";
  const doc = insertMany(emptyDocument(), { user, score });

  const myRank = { rank: 1, user, score };
  expect(fetchRanksByOffset(doc, 0, 100)).toEqual([myRank]);
  expect(fetchMyRank(doc, user)).toEqual(myRank);
  expect(fetchAroundRanks(doc, user, 2)).toEqual([myRank]);
});

test("add-two", () => {
  const record1 = { rank: 2, user: "user1", score: "123456789123456789" };
  const record2 = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc = insertMany(emptyDocument(), record1, record2);

  expect(fetchRanksByOffset(doc, 0, 100)).toEqual([record2, record1]);
  expect(fetchMyRank(doc, record1.user)).toEqual(record1);
  expect(fetchMyRank(doc, record2.user)).toEqual(record2);
  expect(fetchAroundRanks(doc, record1.user, 2)).toEqual([record2, record1]);
  expect(fetchAroundRanks(doc, record2.user, 2)).toEqual([record2, record1]);
});

test("update-one", () => {
  const record1a = { rank: 2, user: "user1", score: "123456789123456789" };
  const record1b = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc1 = insertMany(emptyDocument(), record1a, record1b);
  expect(fetchRanksByOffset(doc1, 0, 100)).toEqual([record1b, record1a]);

  const record2a = { rank: 1, user: "user1", score: "323456789123456789" };
  const record2b = { rank: 2, user: "user2", score: "223456789123456789" };
  const doc2 = insertMany(doc1, record2a, record2b);
  expect(fetchMyRank(doc2, record2a.user)).toEqual(record2a);
  expect(fetchMyRank(doc2, record2b.user)).toEqual(record2b);
  expect(fetchAroundRanks(doc2, record2a.user, 2)).toEqual([
    record2a,
    record2b
  ]);
  expect(fetchAroundRanks(doc2, record2b.user, 2)).toEqual([
    record2a,
    record2b
  ]);
});

test("skip-update", () => {
  const record1a = { rank: 2, user: "user1", score: "123456789123456789" };
  const record1b = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc1 = insertMany(emptyDocument(), record1a, record1b);
  expect(fetchRanksByOffset(doc1, 0, 100)).toEqual([record1b, record1a]);

  const record2a = { rank: 1, user: "user1", score: "12345678912345678" };
  const doc2 = insertMany(doc1, record2a);

  expect(fetchMyRank(doc2, record2a.user)).toEqual(record1a);
  expect(fetchMyRank(doc2, record1b.user)).toEqual(record1b);
  expect(fetchAroundRanks(doc2, record2a.user, 2)).toEqual([
    record1b,
    record1a
  ]);
  expect(fetchAroundRanks(doc2, record1b.user, 2)).toEqual([
    record1b,
    record1a
  ]);
});

const generateRanks = (
  fromUserId: number,
  toUserId: number,
  totalCount: number,
  stepSize: number = 1
) =>
  Array(toUserId - fromUserId + 1)
    .fill(0)
    .map((_, i) => i + fromUserId)
    .map(i => ({
      rank: Math.floor(totalCount / stepSize) - Math.floor(i / stepSize) + 1,
      user: `user${i}`,
      score: Math.floor(i / stepSize).toString()
    }))
    .reverse();

test("fetch-topn-near-without-same-rank", () => {
  const generate = (fromUserId: number = 1, toUserId: number = 100) =>
    generateRanks(fromUserId, toUserId, 100, 1);

  const doc = insertMany(emptyDocument(), ...reverse(generate()));
  const top20 = fetchRanksByOffset(doc, 0, 20);
  expect(top20.length).toBe(20);
  expect(top20).toEqual(generate(81, 100));

  const near50 = fetchAroundRanks(doc, `user50`, 20);
  expect(near50.length).toBe(20);
  expect(near50).toEqual(generate(41, 60));
});

test("fetch-topn-near-with-same-rank", () => {
  const generate = (fromUserId: number = 1, toUserId: number = 100) =>
    generateRanks(fromUserId, toUserId, 100, 10);

  const doc = insertMany(emptyDocument(), ...reverse(generate()));
  const top20 = fetchRanksByOffset(doc, 0, 20);
  expect(top20.length).toBe(20);
  expect(top20).toEqual(generate(81, 100));

  const near50 = fetchAroundRanks(doc, `user50`, 20);
  expect(near50.length).toBe(20);
  expect(near50).toEqual(generate(41, 60));
});

test("scroll-without-same-rank", () => {
  const generate = (fromUserId: number = 1, toUserId: number = 100) =>
    generateRanks(fromUserId, toUserId, 100, 1);

  const doc = insertMany(emptyDocument(), ...reverse(generate()));
  const up = scrollUpRanks(doc, `user50`, 20);
  expect(up.length).toBe(20);
  expect(up).toEqual(generate(51, 70));

  const down = scrollDownRanks(doc, `user50`, 20);
  expect(down.length).toBe(20);
  expect(down).toEqual(generate(30, 49));
});

test("scroll-with-same-rank", () => {
  const generate = (fromUserId: number = 1, toUserId: number = 100) =>
    generateRanks(fromUserId, toUserId, 100, 10);

  const doc = insertMany(emptyDocument(), ...reverse(generate()));
  const up = scrollUpRanks(doc, `user50`, 20);
  expect(up.length).toBe(20);
  expect(up).toEqual(generate(51, 70));

  const down = scrollDownRanks(doc, `user50`, 20);
  expect(down.length).toBe(20);
  expect(down).toEqual(generate(30, 49));
});

test("unexpected", () => {
  expect(fetchMyRank(emptyDocument(), `unknown`)).toBeUndefined();
  expect(fetchUserAroundRanks(emptyDocument(), `unknown`, -1)).toEqual([]);
});
