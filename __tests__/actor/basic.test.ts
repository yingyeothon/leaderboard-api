import { requestToUpdateRank } from "../../src/actor";
import { getRankRepository } from "../../src/rank";

const serviceKey = "__tests__/basic";

beforeEach(async () => {
  const repository = await getRankRepository(serviceKey);
  await repository.truncate();
});

afterEach(async () => {
  const repository = await getRankRepository(serviceKey);
  await repository.truncate();
});

test("simple", async () => {
  const user = "user1";
  const score = "123456789123456789123456789";
  await requestToUpdateRank(serviceKey, user, score);

  const repo = await getRankRepository(serviceKey);
  await repo.load();
  const myRecord = { rank: 1, user, score };
  expect(repo.top(0, 10)).toEqual([myRecord]);
  expect(repo.around(user, 10)).toEqual([myRecord]);
  expect(repo.me(user)).toEqual(myRecord);
});

test("complex", async () => {
  // Scenario 1: [user1, user2]
  const record1a = { rank: 1, user: "user1", score: "123456789123456" };
  const record1b = { rank: 2, user: "user2", score: "123456789123453" };

  await requestToUpdateRank(serviceKey, record1a.user, record1a.score);
  await requestToUpdateRank(serviceKey, record1b.user, record1b.score);

  const repo = await getRankRepository(serviceKey);
  await repo.load();
  expect(repo.top(0, 10)).toEqual([record1a, record1b]);
  expect(repo.around(record1a.user, 10)).toEqual([record1a, record1b]);
  expect(repo.around(record1b.user, 10)).toEqual([record1a, record1b]);
  expect(repo.me(record1a.user)).toEqual(record1a);
  expect(repo.me(record1b.user)).toEqual(record1b);

  // Scenario 2: [user1-not-updated, user2-updated]
  const record2a = { rank: 1, user: "user1", score: "123456789123454" };
  const record2b = { rank: 2, user: "user2", score: "123456789123455" };

  await requestToUpdateRank(serviceKey, record2a.user, record2a.score);
  await requestToUpdateRank(serviceKey, record2b.user, record2b.score);

  // user1 would not be updated because a new score is lower than old one.
  // user2 would be updated but it is still rank 2.
  await repo.load();
  expect(repo.top(0, 10)).toEqual([record1a, record2b]);
  expect(repo.around(record2a.user, 10)).toEqual([record1a, record2b]);
  expect(repo.around(record2b.user, 10)).toEqual([record1a, record2b]);
  expect(repo.me(record2a.user)).toEqual(record1a);
  expect(repo.me(record2b.user)).toEqual(record2b);

  // Scenario 3: [user3, user1, user2]
  const record3a = { rank: 2, user: "user1", score: record1a.score };
  const record3b = { rank: 3, user: "user2", score: record2b.score };
  const record3c = { rank: 1, user: "user3", score: "123456789123458" };

  // Update user3 only.
  await requestToUpdateRank(serviceKey, record3c.user, record3c.score);

  // The distance between `user2` and `user3` is "2" so they can't see each other
  // when `limit` is "2".
  await repo.load();
  expect(repo.top(0, 10)).toEqual([record3c, record3a, record3b]);
  expect(repo.around(record3a.user, 2)).toEqual([record3c, record3a]);
  expect(repo.around(record3b.user, 2)).toEqual([record3a, record3b]);
  expect(repo.around(record3c.user, 2)).toEqual([record3c, record3a]);
  expect(repo.me(record3a.user)).toEqual(record3a);
  expect(repo.me(record3b.user)).toEqual(record3b);
  expect(repo.me(record3c.user)).toEqual(record3c);
});
