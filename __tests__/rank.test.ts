import * as rank from "../src/rank";

test("add-one", () => {
  const user = "user1";
  const score = "123456789123456789";
  const doc = rank.insertOrUpdateRank(undefined, user, score);

  const myRank = { rank: 1, user, score };
  expect(rank.fetchRanks(doc, 0, 100)).toEqual([myRank]);
  expect(rank.fetchMyRank(doc, user)).toEqual(myRank);
  expect(rank.fetchUserRank(doc, user, 1)).toEqual([myRank]);
});

test("add-two", () => {
  const record1 = { rank: 2, user: "user1", score: "123456789123456789" };
  const record2 = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc = rank.insertOrUpdateRank(
    rank.insertOrUpdateRank(undefined, record1.user, record1.score),
    record2.user,
    record2.score
  );

  expect(rank.fetchRanks(doc, 0, 100)).toEqual([record2, record1]);
  expect(rank.fetchMyRank(doc, record1.user)).toEqual(record1);
  expect(rank.fetchMyRank(doc, record2.user)).toEqual(record2);
  expect(rank.fetchUserRank(doc, record1.user, 1)).toEqual([record2, record1]);
  expect(rank.fetchUserRank(doc, record2.user, 1)).toEqual([record2, record1]);
});

test("update-one", () => {
  const record1a = { rank: 2, user: "user1", score: "123456789123456789" };
  const record1b = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc1 = rank.insertOrUpdateRank(
    rank.insertOrUpdateRank(undefined, record1a.user, record1a.score),
    record1b.user,
    record1b.score
  );
  expect(rank.fetchRanks(doc1, 0, 100)).toEqual([record1b, record1a]);

  const record2a = { rank: 1, user: "user1", score: "323456789123456789" };
  const record2b = { rank: 2, user: "user2", score: "223456789123456789" };
  const doc2 = rank.insertOrUpdateRank(
    rank.insertOrUpdateRank(doc1, record2a.user, record2a.score),
    record2b.user,
    record2b.score
  );

  expect(rank.fetchMyRank(doc2, record2a.user)).toEqual(record2a);
  expect(rank.fetchMyRank(doc2, record2b.user)).toEqual(record2b);
  expect(rank.fetchUserRank(doc2, record2a.user, 1)).toEqual([
    record2a,
    record2b
  ]);
  expect(rank.fetchUserRank(doc2, record2b.user, 1)).toEqual([
    record2a,
    record2b
  ]);
});

test("skip-update", () => {
  const record1a = { rank: 2, user: "user1", score: "123456789123456789" };
  const record1b = { rank: 1, user: "user2", score: "223456789123456789" };
  const doc1 = rank.insertOrUpdateRank(
    rank.insertOrUpdateRank(undefined, record1a.user, record1a.score),
    record1b.user,
    record1b.score
  );
  expect(rank.fetchRanks(doc1, 0, 100)).toEqual([record1b, record1a]);

  const record2a = { rank: 1, user: "user1", score: "12345678912345678" };
  const doc2 = rank.insertOrUpdateRank(doc1, record2a.user, record2a.score);

  expect(rank.fetchMyRank(doc2, record2a.user)).toEqual(record1a);
  expect(rank.fetchMyRank(doc2, record1b.user)).toEqual(record1b);
  expect(rank.fetchUserRank(doc2, record2a.user, 1)).toEqual([
    record1b,
    record1a
  ]);
  expect(rank.fetchUserRank(doc2, record1b.user, 1)).toEqual([
    record1b,
    record1a
  ]);
});

test("correct-topn-near", () => {
  const count = 100;
  let doc: any = undefined;
  for (let index = 1; index <= count; ++index) {
    doc = rank.insertOrUpdateRank(doc, `user${index}`, index.toString());
  }
  const generate = (from: number, to: number) =>
    Array(to - from + 1)
      .fill(0)
      .map((_, i) => i + from)
      .map(i => ({
        rank: count + 1 - i,
        user: `user${i}`,
        score: i.toString()
      }))
      .reverse();

  const top20 = rank.fetchRanks(doc, 0, 20);
  expect(top20.length).toBe(20);
  expect(top20).toEqual(generate(81, 100));

  const near50 = rank.fetchUserRank(doc, `user50`, 10);
  expect(near50.length).toBe(21);
  expect(near50).toEqual(generate(40, 60));
});

test("correct-topn-near-same-rank", () => {
  const count = 100;
  let doc: any = undefined;
  for (let index = 1; index <= count; ++index) {
    doc = rank.insertOrUpdateRank(
      doc,
      `user${index}`,
      Math.floor(index / 10).toString()
    );
  }
  const generate = (from: number, to: number) =>
    Array(to - from + 1)
      .fill(0)
      .map((_, i) => i + from)
      .map(i => ({
        rank: 11 - Math.floor(i / 10),
        user: `user${i}`,
        score: Math.floor(i / 10).toString()
      }))
      .reverse();

  const top20 = rank.fetchRanks(doc, 0, 20);
  expect(top20.length).toBe(20);
  expect(top20).toEqual(generate(81, 100));

  const near50 = rank.fetchUserRank(doc, `user50`, 10);
  expect(near50.length).toBe(21);
  expect(near50).toEqual(
    [
      generate(60, 69),
      generate(50, 50),
      generate(51, 59),
      generate(49, 49)
    ].reduce((a, b) => a.concat(b), [])
  );
});
