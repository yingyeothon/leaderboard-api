import {
  compareNumbers,
  compareScore,
  numbersEqual,
  numbersToScore,
  scoreToNumbers
} from "../../src/rank/score";
import { lowerBound } from "../../src/utils/collection";

test("zero-length", () => {
  const input = "0";
  const numbers = scoreToNumbers(input);
  expect(numbers).toEqual([0]);

  const actual = numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("short-length", () => {
  const input = "123";
  const numbers = scoreToNumbers(input);
  expect(numbers).toEqual([123]);

  const actual = numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("middle-length", () => {
  const input = "123456789987654321123456789";
  const numbers = scoreToNumbers(input);
  expect(numbers).toEqual([54321123456789, 1234567899876]);

  const actual = numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("long-length", () => {
  const input =
    "123456789987654321123456789123456789987654321123456789123456789987654321123456789123456789987654321123456789";
  const numbers = scoreToNumbers(input);
  expect(numbers).toEqual([
    54321123456789,
    91234567899876,
    65432112345678,
    89123456789987,
    76543211234567,
    78912345678998,
    87654321123456,
    1234567899
  ]);

  const actual = numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("comapre", () => {
  const compare = (score1: string, score2: string) =>
    compareNumbers(scoreToNumbers(score1), scoreToNumbers(score2));

  expect(compare("0", "0")).toBe(0);
  expect(compare("123456789123456789", "123456789123456789")).toBe(0);

  expect(compare("123456789123456789", "123456789123456799")).toBe(-1);
  expect(compare("123456789123456789", "923456789123456789")).toBe(-1);

  expect(compare("123456789123456799", "123456789123456789")).toBe(1);
  expect(compare("923456789123456789", "123456789123456789")).toBe(1);
});

test("sorted", () => {
  const values: number[][] = [];
  const insert = (target: number[]) =>
    values.splice(
      lowerBound(values, target, (a, b) => compareNumbers(b, a)),
      0,
      target
    );

  insert(scoreToNumbers("123456789123456789"));
  insert(scoreToNumbers("223456789123456789"));
  insert(scoreToNumbers("323456789123456789"));
  insert(scoreToNumbers("223456789123456799"));

  expect(values).toEqual([
    [56789123456789, 3234],
    [56789123456799, 2234],
    [56789123456789, 2234],
    [56789123456789, 1234]
  ]);
});

test("equal", () => {
  expect(
    numbersEqual(
      scoreToNumbers("123456789123456789123456789123456789123456789123456789"),
      scoreToNumbers("123456789123456789123456789123456789123456789123456789")
    )
  ).toBe(true);

  expect(
    numbersEqual(
      scoreToNumbers("223456789123456789123456789123456789123456789123456789"),
      scoreToNumbers("123456789123456789123456789123456789123456789123456789")
    )
  ).toBe(false);

  expect(
    numbersEqual(
      scoreToNumbers("123456789123456789123456789123456789123456789123456789"),
      scoreToNumbers("123456789123456789123456789123456789123456789123456788")
    )
  ).toBe(false);
});

test("comapre-score", () => {
  expect(compareScore("0", "0")).toBe(0);
  expect(
    compareScore(
      "123456789123456789123456789123456789123456789123456789",
      "123456789123456789123456789123456789123456789123456789"
    )
  ).toBe(0);
  expect(
    compareScore(
      "123456789123456789123456789123456789123456789123456789",
      "223456789123456789123456789123456789123456789123456789"
    )
  ).toBe(-1);
  expect(
    compareScore(
      "123456789123456789123456789123456789123456789123456788",
      "123456789123456789123456789123456789123456789123456789"
    )
  ).toBe(-1);
  expect(
    compareScore(
      "123456789123456789123456789123456789",
      "123456789123456789123456789123456789123456789123456789"
    )
  ).toBe(-1);
  expect(
    compareScore(
      "223456789123456789123456789123456789123456789123456789",
      "123456789123456789123456789123456789123456789123456789"
    )
  ).toBe(1);
  expect(
    compareScore(
      "123456789123456789123456789123456789123456789123456789",
      "123456789123456789123456789123456789123456789123456788"
    )
  ).toBe(1);
  expect(
    compareScore(
      "123456789123456789123456789123456789123456789123456789",
      "123456789123456789123456789123456789"
    )
  ).toBe(1);
});
