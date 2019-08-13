import { ConsoleLogger } from "@yingyeothon/logger";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { clearRank, updateRank, viewRank } from "./actor";
import { compareScore } from "./score";
export { bottomHalf } from "./actor";

const logger = new ConsoleLogger(`info`);

const viewParams = (event: APIGatewayProxyEvent) => ({
  topN: +((event.queryStringParameters || {}).topN || "10"),
  contextMargin: +((event.queryStringParameters || {}).contextMargin || "5")
});

const sleep = (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, millis));

export const get: APIGatewayProxyHandler = async event => {
  const { serviceId, period } = event.pathParameters;
  if (!serviceId || !period) {
    return { statusCode: 404, body: "Not Found" };
  }
  const user = event.headers["x-user"];
  if (!user) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const serviceKey = [serviceId, period].join("/");
  const { topN, contextMargin } = viewParams(event);
  logger.info(`get`, serviceKey, user, topN, contextMargin);
  try {
    const view = await viewRank(serviceKey, user, topN, contextMargin);
    return { statusCode: 200, body: JSON.stringify(view) };
  } catch (error) {
    logger.error(`get`, serviceKey, user, error);
    return { statusCode: 400, body: "Bad Request" };
  }
};

export const put: APIGatewayProxyHandler = async event => {
  const { serviceId, period } = event.pathParameters;
  if (!serviceId || !period) {
    return { statusCode: 404, body: "Not Found" };
  }
  const user = event.headers["x-user"];
  if (!user) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  const serviceKey = [serviceId, period].join("/");
  const score = event.body.trim();
  logger.info(`put`, serviceKey, user, score);

  try {
    await updateRank(serviceKey, user, score);
  } catch (error) {
    logger.error(`put`, serviceKey, event.body, error);
    return { statusCode: 400, body: "Bad Request" };
  }

  const { topN, contextMargin } = viewParams(event);
  const view = await viewRankUntilUpdated(
    serviceKey,
    user,
    score,
    topN,
    contextMargin
  );
  return { statusCode: 200, body: JSON.stringify(view) };
};

const viewRankUntilUpdated = async (
  serviceKey: string,
  user: string,
  score: string,
  topN: number,
  contextMargin: number
) => {
  for (let index = 0; index < 10; ++index) {
    logger.info(`loadRanks-afterPut[${index}]`, serviceKey, user, score);
    const view = await viewRank(serviceKey, user, topN, contextMargin);

    const userInView = view.context.find(each => each.user === user);
    logger.info(`loadRanks-afterPut`, `checkUser`, user, score, userInView);

    // Accept only if a new score is higher than old one.
    if (userInView && compareScore(userInView.score, score) >= 0) {
      return view;
    }
    await sleep(100);
  }
  logger.error(`loadRanks-afterPut`, `timeout`, serviceKey, user);
  return viewRank(serviceKey, user, topN, contextMargin);
};

export const clear: APIGatewayProxyHandler = async event => {
  const { serviceId, period } = event.pathParameters;
  if (!serviceId || !period) {
    return { statusCode: 404, body: "Not Found" };
  }
  const auth = event.headers["x-auth"];
  if (!process.env.AUTH && auth !== process.env.AUTH) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  const serviceKey = [serviceId, period].join("/");
  logger.info(`clear`, serviceKey);
  try {
    await clearRank(serviceKey);
    return { statusCode: 200, body: "OK" };
  } catch (error) {
    logger.error(`clear`, serviceKey, error);
    return { statusCode: 400, body: "Bad Request" };
  }
};
