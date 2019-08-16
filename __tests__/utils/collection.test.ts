import {
  arrayCompare,
  arrayEquals,
  lowerBound,
  reverse
} from "../../src/utils/collection";

test("reverse", () => {
  const input = [1, 2, 3];
  const reversed = reverse(input);
  expect(input).toEqual([1, 2, 3]);
  expect(reversed).toEqual([3, 2, 1]);
});

test("arrayCompare", () => {
  expect(arrayCompare([1, 2, 3], [1, 2, 3], (a, b) => a - b)).toBe(0);
  expect(arrayCompare([1, 2], [1, 2, 3], (a, b) => a - b)).toBe(-1);
  expect(arrayCompare([1, 2, 3], [1, 2], (a, b) => a - b)).toBe(1);
  expect(arrayCompare([1, 2, 3], [1, 2, 4], (a, b) => a - b)).toBe(-1);
  expect(arrayCompare([1, 2, 4], [1, 2, 3], (a, b) => a - b)).toBe(1);
  expect(arrayCompare([1, 2, 3], [1, 3, 3], (a, b) => a - b)).toBe(-1);
  expect(arrayCompare([1, 3, 3], [1, 2, 3], (a, b) => a - b)).toBe(1);
});

test("arrayEquals", () => {
  expect(arrayEquals([1, 2, 3], [1, 2, 3])).toBe(true);
  expect(arrayEquals([], [])).toBe(true);

  expect(arrayEquals([1, 2, 3], [1, 2])).toBe(false);
  expect(arrayEquals([1, 2], [1, 2, 3])).toBe(false);
  expect(arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false);

  expect(arrayEquals(undefined, undefined)).toBe(false);
  expect(arrayEquals([1, 2, 3], undefined)).toBe(false);
  expect(arrayEquals(undefined, [1, 2, 3])).toBe(false);
});

test("lowerBound", () => {
  const lb = (values: number[], target: number) =>
    lowerBound(values, target, (a, b) => b - a);
  expect(lb([6, 4, 2], 1)).toBe(3);
  expect(lb([6, 4, 2], 2)).toBe(2);
  expect(lb([6, 4, 2], 3)).toBe(2);
  expect(lb([6, 4, 2], 4)).toBe(1);
  expect(lb([6, 4, 2], 5)).toBe(1);
  expect(lb([6, 4, 2], 6)).toBe(0);
  expect(lb([6, 4, 2], 7)).toBe(0);

  expect(lb([2], 1)).toBe(1);
  expect(lb([2], 2)).toBe(0);
  expect(lb([2], 3)).toBe(0);
});
