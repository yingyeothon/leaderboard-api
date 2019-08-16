import { shiftToNextLambda } from "@yingyeothon/actor-system-aws-lambda-support";
import { getRankRepository } from "../rank";
import elapsed from "../system/elapsed";
import { getActorSystem } from "../system/external";
import logger from "../system/logger";

interface IRankMessage {
  user: string;
  score: string;
  commit?: boolean;
}

const onRankPayload = (serviceKey: string) => async ({
  message: { user, score, commit = true }
}: {
  message: IRankMessage;
}) => {
  try {
    const repository = await getRankRepository(serviceKey);
    await repository.update(user, score, commit);
  } catch (error) {
    logger.error(`CannotUpdateRank`, serviceKey, user, score, error);
  }
};

export const getRankActor = elapsed(`getRankActor`, (serviceKey: string) =>
  getActorSystem().spawn<IRankMessage>(serviceKey, actor =>
    actor
      .on("act", onRankPayload(serviceKey))
      .on("error", error => logger.error(`ActorError`, serviceKey, error))
      .on(
        "shift",
        shiftToNextLambda({ functionName: process.env.BOTTOM_HALF_LAMBDA })
      )
  )
);
