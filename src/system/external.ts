import {
  ActorSystem,
  InMemoryLock,
  InMemoryQueue
} from "@yingyeothon/actor-system";
import { RedisLock, RedisQueue } from "@yingyeothon/actor-system-redis-support";
// import { S3Repository } from '@yingyeothon/repository-s3';
import { InMemoryRepository } from "@yingyeothon/repository";
import { RedisRepository } from "@yingyeothon/repository-redis";
import IORedis from "ioredis";
import mem from "mem";
import envars from "./envars";
import logger from "./logger";

export const getRedis = mem(() => {
  if (!envars.external.production) {
    throw new Error(`Do not use Redis while testing.`);
  }
  return new IORedis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
  });
});

export const getActorSystem = mem(() =>
  envars.external.production
    ? new ActorSystem({
        queue: new RedisQueue({ redis: getRedis(), logger }),
        lock: new RedisLock({ redis: getRedis(), logger }),
        logger
      })
    : new ActorSystem({
        queue: new InMemoryQueue(),
        lock: new InMemoryLock(),
        logger
      })
);

export const getRepository = mem(() =>
  envars.external.production
    ? // Don't use S3 as a repository until writing all of tests for this and throttling this by API Gateway settings.
      // new S3Repository({ bucketName: process.env.BUCKET_NAME });
      new RedisRepository({ redis: getRedis(), prefix: "leaderboard:" })
    : new InMemoryRepository()
);
