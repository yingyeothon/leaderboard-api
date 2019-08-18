import {
  handleActorLambdaEvent,
  shiftToNextLambda
} from "@yingyeothon/actor-system-aws-lambda-support";
import { getRankRepository, IRankRepository } from "../rank";
import elapsed from "../system/elapsed";
import envars from "../system/envars";
import { getActorSystem } from "../system/external";
import logger from "../system/logger";

interface IRankMessage {
  user: string;
  score: string;
}

class RankProcessor {
  private repository: IRankRepository | null = null;

  constructor(private readonly serviceKey: string) {}

  public onMessage = ({
    message: { user, score }
  }: {
    message: IRankMessage;
  }) => {
    try {
      this.repository!.update(user, score);
    } catch (error) {
      logger.error(`CannotUpdateRank`, this.serviceKey, user, score, error);
    }
  };

  public onBeforeAct = async () => {
    if (this.repository === null) {
      this.repository = getRankRepository(this.serviceKey);
    }
    await elapsed(`beforeAct:loadRepository`, () => this.repository.load())();
  };

  public onAfterAct = async () => {
    await elapsed(`afterAct:commitRepository`, () =>
      this.repository!.commit()
    )();
  };
}

const getRankActor = elapsed(`getRankActor`, (serviceKey: string) => {
  const processor = new RankProcessor(serviceKey);
  return getActorSystem().spawn<IRankMessage>(serviceKey, actor =>
    actor
      .on("beforeAct", processor.onBeforeAct)
      .on("afterAct", processor.onAfterAct)
      .on("act", processor.onMessage)
      .on("error", error => logger.error(`ActorError`, serviceKey, error))
      .on("shift", shiftToNextLambda({ functionName: envars.actor.bottomHalf }))
  );
});

const topHalfTimeout = 2000;
const bottomHalfTimeout = 890 * 1000;

export const requestToUpdateRank = elapsed(
  `requestToUpdateRank`,
  async (serviceKey: string, user: string, score: string) => {
    if (!serviceKey) {
      throw new Error(`Invalid serviceKey[${serviceKey}]`);
    }
    if (!user || !score || /[^0-9]/.test(score)) {
      throw new Error(`Invalid payload[${user}, ${score}]`);
    }

    await elapsed(`sendPayloadToActor`, () =>
      getRankActor(serviceKey).send(
        { user, score },
        {
          shiftTimeout: topHalfTimeout
        }
      )
    )();
  }
);

export const bottomHalf = handleActorLambdaEvent({
  spawn: ({ actorName }) => getRankActor(actorName),
  functionTimeout: bottomHalfTimeout
});
