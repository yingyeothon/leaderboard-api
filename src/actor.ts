import {
  handleActorLambdaEvent,
  shiftToNextLambda
} from "@yingyeothon/actor-system-aws-lambda-support";
import { ConsoleLogger } from "@yingyeothon/logger";
// import { S3Repository } from '@yingyeothon/repository-s3';
import * as el from "./elapsed";
import external from "./external";
import {
  fetchMyRank,
  fetchRanks,
  fetchUserRank,
  insertOrUpdateRank,
  IRankDocument,
  IRankRecord
} from "./rank";

const logger = new ConsoleLogger(!!process.env.DEBUG ? "debug" : "info");
const { getActorSystem, getRepository } = external;

interface IRankMessage {
  user: string;
  score: string;
}

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
  getActorSystem().spawn<IRankMessage>(serviceKey, actor =>
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
  logger.debug(`viewRank`, view);
  return view;
};

export const clearRank = async (serviceKey: string) => {
  const repo = getRepository();
  await el.p(`clearRanks`, () => repo.delete(serviceKey));
};
