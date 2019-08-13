import { LogSeverity } from "@yingyeothon/logger";
import * as actor from "../src/actor";
import * as el from "../src/elapsed";

let oldEnv: { [name: string]: string };
let oldSeverity: LogSeverity;
beforeAll(() => {
  // Setup test profile.
  oldEnv = { ...(process.env || {}) };

  // There is no Redis in Travis environment,
  // in that case, use the outer one.
  if (!process.env.TRAVIS_BRANCH) {
    process.env.REDIS_HOST = "localhost";
    process.env.REDIS_PASSWORD = "";
  }

  oldSeverity = el.forTest.logSeverity();
  el.forTest.changeLogSeverity("error");
});

afterAll(() => {
  process.env = oldEnv;
  el.forTest.changeLogSeverity(oldSeverity);
});

beforeEach(async () => {
  await actor.clearRank(serviceKey);
});

const serviceKey = "__test__/d";

test("simple", async () => {
  const user = "user1";
  const score = "123456789123456789123456789";
  await actor.updateRank(serviceKey, user, score);

  const view = await actor.viewRank(serviceKey, user, 5, 1);
  const myRecord = { rank: 1, user, score };
  expect(view.top).toEqual([myRecord]);
  expect(view.context).toEqual([myRecord]);
  expect(view.me).toEqual(myRecord);
});

test("complex", async () => {
  // Scenario 1: [user1, user2]
  const record1a = { rank: 1, user: "user1", score: "123456789123456" };
  const record1b = { rank: 2, user: "user2", score: "123456789123453" };

  await actor.updateRank(serviceKey, record1a.user, record1a.score);
  await actor.updateRank(serviceKey, record1b.user, record1b.score);

  const view1a = await actor.viewRank(serviceKey, record1a.user, 5, 1);
  expect(view1a.top).toEqual([record1a, record1b]);
  expect(view1a.context).toEqual([record1a, record1b]);
  expect(view1a.me).toEqual(record1a);

  const view1b = await actor.viewRank(serviceKey, record1b.user, 5, 1);
  expect(view1b.top).toEqual([record1a, record1b]);
  expect(view1b.context).toEqual([record1a, record1b]);
  expect(view1b.me).toEqual(record1b);

  // Scenario 2: [user1-not-updated, user2-updated]
  const record2a = { rank: 1, user: "user1", score: "123456789123454" };
  const record2b = { rank: 2, user: "user2", score: "123456789123455" };

  await actor.updateRank(serviceKey, record2a.user, record2a.score);
  await actor.updateRank(serviceKey, record2b.user, record2b.score);

  // user1 would not be updated because a new score is lower than old one.
  const view2a = await actor.viewRank(serviceKey, record2a.user, 5, 1);
  expect(view2a.top).toEqual([record1a, record2b]);
  expect(view2a.context).toEqual([record1a, record2b]);
  expect(view2a.me).toEqual(record1a);

  // user2 would be updated but it is still rank 2.
  const view2b = await actor.viewRank(serviceKey, record2b.user, 5, 1);
  expect(view2b.top).toEqual([record1a, record2b]);
  expect(view2b.context).toEqual([record1a, record2b]);
  expect(view2b.me).toEqual(record2b);

  // Scenario 3: [user3, user1, user2]
  const record3a = { rank: 2, user: "user1", score: record1a.score };
  const record3b = { rank: 3, user: "user2", score: record2b.score };
  const record3c = { rank: 1, user: "user3", score: "123456789123458" };

  // Update user3 only.
  await actor.updateRank(serviceKey, record3c.user, record3c.score);

  const view3a = await actor.viewRank(serviceKey, record3a.user, 5, 1);
  expect(view3a.top).toEqual([record3c, record3a, record3b]);
  expect(view3a.context).toEqual([record3c, record3a, record3b]);
  expect(view3a.me).toEqual(record3a);

  // The distance between `user2` and `user3` is "2" so they can't see each other
  // when `contextRange` is "1".
  const view3b = await actor.viewRank(serviceKey, record3b.user, 5, 1);
  expect(view3b.top).toEqual([record3c, record3a, record3b]);
  expect(view3b.context).toEqual([record3a, record3b]);
  expect(view3b.me).toEqual(record3b);

  const view3c = await actor.viewRank(serviceKey, record3c.user, 5, 1);
  expect(view3c.top).toEqual([record3c, record3a, record3b]);
  expect(view3c.context).toEqual([record3c, record3a]);
  expect(view3c.me).toEqual(record3c);
});
