import { getRankRepository } from "../rank";
import elapsed from "../system/elapsed";
import logger from "../system/logger";

export const waitMyRankUntilUpdated = elapsed(
  `waitUntilUpdateRank`,
  async (
    serviceKey: string,
    user: string,
    score: string,
    timeout: number = 4000
  ) => {
    const repository = getRankRepository(serviceKey);

    // If this repository is already loaded,
    // it can fast exit this loop without newly loading.
    if (!repository.isUpdatable(user, score)) {
      return repository.me(user);
    }

    const waitUntil = Date.now() + timeout;

    // Wait until it cannot be updatable,
    // that is, it is already updated to more higher score.
    for (const waitMillis of [100, 200, 300, 400, 500, 600, 900, 1000]) {
      await repository.load();
      if (!repository.isUpdatable(user, score)) {
        return repository.me(user);
      }
      await sleep(Math.min(waitMillis, waitUntil - Date.now()));
    }
    logger.error(`CannotWaitUntilUpdated`, serviceKey, user, score, timeout);
    return repository.me(user);
  }
);

const sleep = (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, Math.max(0, millis)));
