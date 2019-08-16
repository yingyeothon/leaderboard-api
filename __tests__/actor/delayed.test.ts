import { requestToUpdateRank } from "../../src/actor";
import { getRankRepository } from "../../src/rank";

const serviceKey = "__tests__/delayed";

beforeEach(async () => {
  const repository = await getRankRepository(serviceKey);
  await repository.truncate();
});

afterEach(async () => {
  const repository = await getRankRepository(serviceKey);
  await repository.truncate();
});

test(`delayed-update`, async () => {
  const repository = await getRankRepository(serviceKey);
  await requestToUpdateRank(serviceKey, `user`, `123456789`, 50, false);
  await repository.load();
  expect(repository.me(`user`)).toBeUndefined();

  await requestToUpdateRank(serviceKey, `user`, `123456789`, 50, true);
  await repository.load();
  expect(repository.me(`user`)).toEqual({
    rank: 1,
    score: `123456789`,
    user: `user`
  });
});
