import {
  ActorSystem,
  InMemoryLock,
  InMemoryQueue
} from "@yingyeothon/actor-system";
import { RedisLock, RedisQueue } from "@yingyeothon/actor-system-redis-support";
import { InMemoryRepository } from "@yingyeothon/repository";
import { S3Repository } from "@yingyeothon/repository-s3";
// import { RedisRepository } from "@yingyeothon/repository-redis";
import IORedis from "ioredis";
import mem from "mem";
import envars from "./envars";
import logger from "./logger";

export const getRedis = mem(() => {
  if (!envars.external.production) {
    throw new Error(`Do not use Redis while testing.`);
  }
  return new IORedis(envars.redis);
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
    ? new S3Repository({ bucketName: envars.repository.s3.bucketName })
    : // ? new RedisRepository({ redis: getRedis(), prefix: "leaderboard:" })
      new InMemoryRepository()
);
