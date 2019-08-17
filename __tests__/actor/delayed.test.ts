import { waitMyRankUntilUpdated } from "../../src/actor";
import { getRankRepository } from "../../src/rank";

const serviceKey = "__tests__/delayed";

beforeEach(async () => {
  await getRankRepository(serviceKey).truncate();
});

afterEach(async () => {
  await getRankRepository(serviceKey).truncate();
});

test(`delayed-update`, async () => {
  const repository = getRankRepository(serviceKey);

  // Scenario: not yet updated.
  repository.update(`user`, `123`);
  await repository.commit();

  const me1 = await waitMyRankUntilUpdated(serviceKey, `user`, `234`, 10);
  expect(repository.isUpdatable(`user`, `234`)).toBe(true);
  expect(me1).toEqual({ rank: 1, score: "123", user: "user" });

  // Update by the other worker.
  repository.update(`user`, `234`);
  await repository.commit();

  const me2 = await waitMyRankUntilUpdated(serviceKey, `user`, `234`, 10);
  expect(repository.isUpdatable(`user`, `234`)).toBe(false);
  expect(me2).toEqual({ rank: 1, score: "234", user: "user" });
});
