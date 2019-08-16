import envars from "../../src/system/envars";
import { getRedis } from "../../src/system/external";

test("no-redis", () => {
  const oldValue = envars.external.production;
  envars.external.production = false;

  expect(() => getRedis()).toThrow("Do not use Redis");

  envars.external.production = oldValue;
});
