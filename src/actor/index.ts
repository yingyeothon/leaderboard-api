import { handleActorLambdaEvent } from "@yingyeothon/actor-system-aws-lambda-support";
import elapsed from "../system/elapsed";
import { getRankActor } from "./actor";
import { waitUntilUpdateRank } from "./waiter";

const topHalfTimeout = 5 * 1000;
const bottomHalfTimeout = 890 * 1000;

export const requestToUpdateRank = elapsed(
  `requestToUpdateRank`,
  async (
    serviceKey: string,
    user: string,
    score: string,
    updateTimeout: number = 1000,
    commit: boolean = true
  ) => {
    if (!serviceKey) {
      throw new Error(`Invalid serviceKey[${serviceKey}]`);
    }
    if (!user || !score || /[^0-9]/.test(score)) {
      throw new Error(`Invalid payload[${user}, ${score}]`);
    }

    await elapsed(`sendPayloadToActor`, () =>
      getRankActor(serviceKey).send(
        { user, score, commit },
        {
          shiftTimeout: topHalfTimeout
        }
      )
    )();
    if (updateTimeout > 0) {
      await waitUntilUpdateRank(serviceKey, user, score, updateTimeout);
    }
  }
);

export const bottomHalf = handleActorLambdaEvent({
  spawn: getRankActor,
  functionTimeout: bottomHalfTimeout
});
