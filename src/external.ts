import {
  ActorSystem,
  InMemoryLock,
  InMemoryQueue
} from "@yingyeothon/actor-system";
import { RedisLock, RedisQueue } from "@yingyeothon/actor-system-redis-support";
import { ConsoleLogger } from "@yingyeothon/logger";
// import { S3Repository } from '@yingyeothon/repository-s3';
import { InMemoryRepository, IRepository } from "@yingyeothon/repository";
import { RedisRepository } from "@yingyeothon/repository-redis";
import IORedis from "ioredis";
import mem from "mem";

const logger = new ConsoleLogger(!!process.env.DEBUG ? "debug" : "info");

interface IExternal {
  getRedis: () => IORedis.Redis;
  getActorSystem: () => ActorSystem;
  getRepository: () => IRepository;
}

// tslint:disable:max-classes-per-file
class ProductionExternal implements IExternal {
  public getRedis = mem(
    () =>
      new IORedis({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD
      })
  );

  public getActorSystem = mem(
    () =>
      new ActorSystem({
        queue: new RedisQueue({ redis: this.getRedis(), logger }),
        lock: new RedisLock({ redis: this.getRedis(), logger }),
        logger
      })
  );

  public getRepository = mem(
    () =>
      new RedisRepository({ redis: this.getRedis(), prefix: "leaderboard:" })
  );
  // Don't use S3 as a repository until writing all of tests for this and throttling this by API Gateway settings.
  // new S3Repository({ bucketName: process.env.BUCKET_NAME });
}

class TestExternal implements IExternal {
  public getActorSystem = mem(
    () =>
      new ActorSystem({
        queue: new InMemoryQueue(),
        lock: new InMemoryLock(),
        logger
      })
  );

  public getRepository = mem(() => new InMemoryRepository());

  public getRedis = () => {
    throw new Error(`Do not use Redis while testing.`);
  };
}

const external =
  process.env.NODE_ENV === "test"
    ? new TestExternal()
    : new ProductionExternal();
export default external;
