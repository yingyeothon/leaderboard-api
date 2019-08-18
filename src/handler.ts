import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { requestToUpdateRank, waitMyRankUntilUpdated } from "./actor";
import { getRankRepository, IRankRepository } from "./rank";
import logger from "./system/logger";
import { safeIntQueryParam, safeStringQueryParam } from "./utils/request";
import envars from "./system/envars";
export { bottomHalf } from "./actor";

const prepareRequest = (event: APIGatewayProxyEvent) => {
  const { serviceId, period } = event.pathParameters;
  if (!serviceId || !period) {
    throw new Error(`Not Found`);
  }
  const queryParams = event.queryStringParameters;
  return {
    serviceKey: [serviceId, period].join("/"),
    user: () => {
      const user = event.headers["x-user"];
      if (!user) {
        throw new Error(`Unauthorized`);
      }
      return user;
    },
    cursor: () => safeStringQueryParam(queryParams, "cursor"),
    offset: () => safeIntQueryParam(queryParams, "offset"),
    limit: () =>
      safeIntQueryParam(queryParams, "limit", {
        maxValue: 100,
        defaultValue: 10
      })
  };
};

const handleFetch = (
  fetch: (
    args: {
      repository: IRankRepository;
    } & ReturnType<typeof prepareRequest>
  ) => any
): APIGatewayProxyHandler => async (event: APIGatewayProxyEvent) => {
  const parameters = prepareRequest(event);
  const { serviceKey } = parameters;
  try {
    const repository = getRankRepository(serviceKey);
    await repository.load();
    return {
      statusCode: 200,
      body: JSON.stringify(fetch({ ...parameters, repository }))
    };
  } catch (error) {
    logger.error(`get`, serviceKey, error);
    return { statusCode: 400, body: "Bad Request" };
  }
};

export const get: APIGatewayProxyHandler = handleFetch(
  ({ repository, user, limit }) => ({
    top: repository.top(0, limit()),
    me: repository.me(user()),
    around: repository.around(user(), limit())
  })
);

export const me: APIGatewayProxyHandler = handleFetch(({ repository, user }) =>
  repository.me(user())
);

export const top: APIGatewayProxyHandler = handleFetch(
  ({ repository, offset, limit }) => repository.top(offset(), limit())
);

export const around: APIGatewayProxyHandler = handleFetch(
  ({ repository, user, limit }) => repository.around(user(), limit())
);

export const scrollUp: APIGatewayProxyHandler = handleFetch(
  ({ repository, cursor, limit }) => repository.scroll(cursor(), "up", limit())
);

export const scrollDown: APIGatewayProxyHandler = handleFetch(
  ({ repository, cursor, limit }) =>
    repository.scroll(cursor(), "down", limit())
);

export const put: APIGatewayProxyHandler = async event => {
  if ((event as any).source === "serverless-plugin-warmup") {
    logger.info(`Lambda is warmup.`);
    return;
  }

  const { serviceKey, user: getUser } = prepareRequest(event);
  try {
    const user = getUser();
    const score = (event.body || "").trim();
    logger.info(`put`, serviceKey, user, score);

    await requestToUpdateRank(serviceKey, user, score);
    const myRank = await waitMyRankUntilUpdated(serviceKey, user, score);
    logger.info(`put`, `completion`, serviceKey, user, score, myRank);

    return { statusCode: 200, body: JSON.stringify(myRank) };
  } catch (error) {
    logger.error(`put`, serviceKey, event.body, error);
    return { statusCode: 400, body: "Bad Request" };
  }
};

export const clear: APIGatewayProxyHandler = async event => {
  const { serviceId, period } = event.pathParameters;
  if (!serviceId || !period) {
    return { statusCode: 404, body: "Not Found" };
  }
  const auth = event.headers["x-auth"];
  if (!envars.admin.authKey && auth !== envars.admin.authKey) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  const serviceKey = [serviceId, period].join("/");
  logger.info(`clear`, serviceKey);
  try {
    await getRankRepository(serviceKey).truncate();
    return { statusCode: 200, body: "OK" };
  } catch (error) {
    logger.error(`clear`, serviceKey, error);
    return { statusCode: 400, body: "Bad Request" };
  }
};
