import * as score from "../src/score";

test("short-length", () => {
  const input = "123";
  const numbers = score.scoreToNumbers(input);
  expect(numbers).toEqual([123]);

  const actual = score.numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("middle-length", () => {
  const input = "123456789987654321123456789";
  const numbers = score.scoreToNumbers(input);
  expect(numbers).toEqual([54321123456789, 1234567899876]);

  const actual = score.numbersToScore(numbers);
  expect(actual).toEqual(input);
});

test("long-length", () => {
  const input =
    "123456789987654321123456789123456789987654321123456789123456789987654321123456789123456789987654321123456789";
  const numbers = score.scoreToNumbers(input);
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

  const actual = score.numbersToScore(numbers);
  expect(actual).toEqual(input);
});
