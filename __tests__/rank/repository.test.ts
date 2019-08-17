import { getRankRepository } from "../../src/rank";

const serviceKey = `__tests__/repository`;

beforeEach(async () => {
  await getRankRepository(serviceKey).truncate();
});

afterEach(async () => {
  await getRankRepository(serviceKey).truncate();
});

test("basic-flow", async () => {
  const repo = getRankRepository(serviceKey);
  repo.update(`user1`, `123456789`);
  repo.update(`user2`, `123456799`);
  repo.update(`user3`, `123456999`);
  repo.update(`user4`, `123459999`);

  expect(repo.top(1, 3)).toEqual([
    { rank: 2, user: `user3`, score: `123456999` },
    { rank: 3, user: `user2`, score: `123456799` },
    { rank: 4, user: `user1`, score: `123456789` }
  ]);

  expect(repo.me(`user4`)).toEqual({
    rank: 1,
    user: `user4`,
    score: `123459999`
  });

  expect(repo.around(`user2`, 3)).toEqual([
    { rank: 2, user: `user3`, score: `123456999` },
    { rank: 3, user: `user2`, score: `123456799` },
    { rank: 4, user: `user1`, score: `123456789` }
  ]);

  expect(repo.isUpdatable(`user1`, `123456789`)).toBe(false);
  expect(repo.isUpdatable(`user1`, `123456788`)).toBe(false);
  expect(repo.isUpdatable(`user1`, `123456799`)).toBe(true);
  expect(repo.isUpdatable(`user1`, `123456999`)).toBe(true);

  expect(repo.scroll(`user2`, `up`, 1)).toEqual([
    { rank: 2, user: `user3`, score: `123456999` }
  ]);
  expect(repo.scroll(`user2`, `down`, 1)).toEqual([
    { rank: 4, user: `user1`, score: `123456789` }
  ]);
});

test(`unexpected`, async () => {
  const repo = getRankRepository(serviceKey);
  expect(repo.around(`unknown`, 10)).toEqual([]);
  expect(() => repo.scroll(`unknown`, `unknown` as any, 10)).toThrow(
    `Invalid direction`
  );
});
