import * as utils from "../src/utils";

test("reverse", () => {
  const input = [1, 2, 3];
  const reversed = utils.reverse(input);
  expect(input).toEqual([1, 2, 3]);
  expect(reversed).toEqual([3, 2, 1]);
});

test("arrayCompare", () => {
  expect(utils.arrayCompare([1, 2, 3], [1, 2, 3], (a, b) => a - b)).toBe(0);
  expect(utils.arrayCompare([1, 2], [1, 2, 3], (a, b) => a - b)).toBe(-1);
  expect(utils.arrayCompare([1, 2, 3], [1, 2], (a, b) => a - b)).toBe(1);
  expect(utils.arrayCompare([1, 2, 3], [1, 2, 4], (a, b) => a - b)).toBe(-1);
  expect(utils.arrayCompare([1, 2, 4], [1, 2, 3], (a, b) => a - b)).toBe(1);
  expect(utils.arrayCompare([1, 2, 3], [1, 3, 3], (a, b) => a - b)).toBe(-1);
  expect(utils.arrayCompare([1, 3, 3], [1, 2, 3], (a, b) => a - b)).toBe(1);
});

test("arrayEquals", () => {
  expect(utils.arrayEquals([1, 2, 3], [1, 2, 3])).toBe(true);
  expect(utils.arrayEquals([], [])).toBe(true);

  expect(utils.arrayEquals([1, 2, 3], [1, 2])).toBe(false);
  expect(utils.arrayEquals([1, 2], [1, 2, 3])).toBe(false);
  expect(utils.arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false);

  expect(utils.arrayEquals(undefined, undefined)).toBe(false);
  expect(utils.arrayEquals([1, 2, 3], undefined)).toBe(false);
  expect(utils.arrayEquals(undefined, [1, 2, 3])).toBe(false);
});
