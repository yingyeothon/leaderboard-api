import elapsed from "../../src/system/elapsed";

test(`non-promise`, () => {
  const adder = elapsed(`adder`, (a: number, b: number) => a + b);
  expect(adder(10, 20)).toBe(30);

  const errorFunction = elapsed(`error`, (a: number) => {
    if (a < 10) {
      throw new Error(`Less than 10`);
    }
    return true;
  });
  expect(() => errorFunction(5)).toThrow(`Less than 10`);
  expect(errorFunction(10)).toBe(true);
});

test(`promise`, async () => {
  const adder = elapsed(`adder`, async (a: number, b: number) => a + b);
  expect(await adder(10, 20)).toBe(30);

  const errorFunction = elapsed(`error`, async (a: number) => {
    await new Promise<void>(resolve => setImmediate(resolve));
    if (a < 10) {
      throw new Error(`Less than 10`);
    }
    return true;
  });
  await errorFunction(5)
    .then(_ => fail())
    .catch(error => expect(error.message).toEqual(`Less than 10`));
  expect(await errorFunction(10)).toBe(true);
});
