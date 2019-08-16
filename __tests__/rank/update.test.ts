import { emptyDocument, IRankDocument } from "../../src/rank/document";
import { insertOrUpdateRank } from "../../src/rank/update";

const insertMany = (
  doc: IRankDocument,
  ...records: Array<{ user: string; score: string }>
) =>
  records.reduce(
    (acc, record) => insertOrUpdateRank(acc, record.user, record.score),
    doc
  );

test("add-one", () => {
  const doc = insertOrUpdateRank(
    emptyDocument(),
    "user1",
    "123456789123456789"
  );

  expect(doc).toEqual({
    scores: [[56789123456789, 1234]],
    users: [["user1"]],
    userIndex: { user1: 0 }
  } as IRankDocument);
});

test("add-two", () => {
  const doc1 = insertOrUpdateRank(
    emptyDocument(),
    "user1",
    "123456789123456789"
  );
  expect(doc1).toEqual({
    scores: [[56789123456789, 1234]],
    users: [["user1"]],
    userIndex: { user1: 0 }
  } as IRankDocument);

  const doc2 = insertOrUpdateRank(doc1, "user2", "223456789123456789");
  expect(doc2).toEqual({
    scores: [[56789123456789, 2234], [56789123456789, 1234]],
    users: [["user2"], ["user1"]],
    userIndex: { user1: 1, user2: 0 }
  } as IRankDocument);
});

test("update-one", () => {
  const doc1 = insertMany(
    emptyDocument(),
    { user: "user1", score: "123456789123456789" },
    { user: "user2", score: "223456789123456789" }
  );
  expect(doc1).toEqual({
    scores: [[56789123456789, 2234], [56789123456789, 1234]],
    users: [["user2"], ["user1"]],
    userIndex: { user1: 1, user2: 0 }
  } as IRankDocument);

  const doc2 = insertMany(
    doc1,
    { user: "user1", score: "323456789123456789" },
    { user: "user2", score: "223456789123456799" }
  );
  expect(doc2).toEqual({
    scores: [[56789123456789, 3234], [56789123456799, 2234]],
    users: [["user1"], ["user2"]],
    userIndex: { user1: 0, user2: 1 }
  } as IRankDocument);
});

test("skip-update", () => {
  const doc1 = insertMany(
    emptyDocument(),
    { user: "user1", score: "123456789123456789" },
    { user: "user2", score: "223456789123456789" }
  );
  expect(doc1).toEqual({
    scores: [[56789123456789, 2234], [56789123456789, 1234]],
    users: [["user2"], ["user1"]],
    userIndex: { user1: 1, user2: 0 }
  } as IRankDocument);

  const doc2 = insertMany(
    doc1,
    { user: "user1", score: "123456789123456789" },
    { user: "user2", score: "223456789123456788" }
  );
  expect(doc2).toEqual({
    scores: [[56789123456789, 2234], [56789123456789, 1234]],
    users: [["user2"], ["user1"]],
    userIndex: { user1: 1, user2: 0 }
  } as IRankDocument);
});
