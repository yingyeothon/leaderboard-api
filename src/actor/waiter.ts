import { getRankRepository } from "../rank";
import elapsed from "../system/elapsed";

const waitIntervalMillis = 50;

export const waitUntilUpdateRank = elapsed(
  `waitUntilUpdateRank`,
  async (serviceKey: string, user: string, score: string, timeout: number) => {
    const waitUntil = Date.now() + timeout;

    // Wait until it cannot be updatable,
    // that is, it is already updated to more higher score.
    let retry = 0;
    while (waitUntil >= Date.now()) {
      const repository = await getRankRepository(serviceKey);
      if (!repository.isUpdatable(user, score)) {
        return true;
      }
      ++retry;
      await sleep(Math.min(waitIntervalMillis * retry, waitUntil - Date.now()));
    }
    return false;
  }
);

const sleep = (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, Math.max(0, millis)));
