import { ActorSystem } from "@yingyeothon/actor-system";
import { RedisQueue, RedisLock } from "@yingyeothon/actor-system-redis-support";
import {
  shiftToNextLambda,
  handleActorLambdaEvent
} from "@yingyeothon/actor-system-aws-lambda-support";
// import { S3Repository } from '@yingyeothon/repository-s3';
import { RedisRepository } from "@yingyeothon/repository-redis";
import { ConsoleLogger } from "@yingyeothon/logger";
import * as IORedis from "ioredis";
import * as el from "./elapsed";
import {
  IRankDocument,
  insertOrUpdateRank,
  IRankRecord,
  fetchRanks,
  fetchUserRank,
  fetchMyRank
} from "./rank";
import { IRepository } from "@yingyeothon/repository";

const redis = new IORedis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});
const logger = new ConsoleLogger("debug");
const sys = new ActorSystem({
  queue: new RedisQueue({ redis, logger }),
  lock: new RedisLock({ redis, logger }),
  logger
});

interface IRankMessage {
  user: string;
  score: string;
}

const getRepository = (): IRepository =>
  new RedisRepository({ redis, prefix: "leaderboard:" });
// Don't use S3 as a repository until writing all of tests for this and throttling this by API Gateway settings.
// new S3Repository({ bucketName: process.env.BUCKET_NAME });

const onRankPayload = (serviceKey: string) => async ({
  message: { user, score }
}: {
  message: IRankMessage;
}) => {
  const repo = getRepository();
  const source = await el.p(`loadRanks`, () =>
    repo.get<IRankDocument>(serviceKey)
  );
  const updated = el.n(`insertOrUpdateRank`, () =>
    insertOrUpdateRank(source, user, score)
  );
  await el.p(`storeRanks`, () => repo.set(serviceKey, updated));
};

const getRankActor = (serviceKey: string) =>
  sys.spawn<IRankMessage>(serviceKey, actor =>
    actor
      .on("act", onRankPayload(serviceKey))
      .on("error", console.error)
      .on(
        "shift",
        shiftToNextLambda({ functionName: process.env.BOTTOM_HALF_LAMBDA })
      )
  );

const topHalfTimeout = 5 * 1000;
const bottomHalfTimeout = 890 * 1000;

export const updateRank = (serviceKey: string, user: string, score: string) => {
  if (!serviceKey) {
    throw new Error(`Invalid serviceKey[${serviceKey}]`);
  }
  if (!user || !score || /[^0-9]/.test(score)) {
    throw new Error(`Invalid payload[${user}, ${score}]`);
  }

  return el.p(`sendPayloadToActor`, () =>
    getRankActor(serviceKey).send(
      { user, score },
      {
        shiftTimeout: topHalfTimeout
      }
    )
  );
};

export const bottomHalf = handleActorLambdaEvent({
  spawn: getRankActor,
  functionTimeout: bottomHalfTimeout
});

interface IRankView {
  top: IRankRecord[];
  context: IRankRecord[];
  me: IRankRecord;
}

export const viewRank = async (
  serviceKey: string,
  user: string,
  topN: number,
  contextMargin: number
): Promise<IRankView> => {
  if (!serviceKey) {
    throw new Error(`Invalid serviceKey[${serviceKey}]`);
  }
  if (!user) {
    throw new Error(`Invalid user[${user}]`);
  }
  if (!topN || topN < 0) {
    throw new Error(`Invalid topN[${topN}]`);
  }

  const repo = getRepository();
  const doc = await el.p(`loadRanks`, () =>
    repo.get<IRankDocument>(serviceKey)
  );
  const top = el.n(`fetchTopN`, () => fetchRanks(doc, 0, topN));
  const context = el.n(`fetchContext`, () =>
    fetchUserRank(doc, user, contextMargin)
  );
  const me = el.n(`fetchMy`, () => fetchMyRank(doc, user));

  const view: IRankView = { top, context, me };
  console.log(`viewRank`, view);
  return view;
};

export const clearRank = async (serviceKey: string) => {
  const repo = getRepository();
  await el.p(`clearRanks`, () => repo.delete(serviceKey));
};
