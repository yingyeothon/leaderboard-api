import { arrayCompare, arrayEquals, reverse } from "../utils/collection";

const maxPrecisionLength = 14; // Math.floor(Math.log10(Number.MAX_SAFE_INTEGER)) - 1

export const scoreToNumbers = (score: string) => {
  const numbers: number[] = [];
  let end = score.length;
  while (end >= 0) {
    numbers.push(+score.slice(Math.max(0, end - maxPrecisionLength), end));
    end -= maxPrecisionLength;
  }
  return numbers;
};

export const numbersToScore = (numbers: number[]) =>
  reverse(numbers)
    .map(value =>
      ("0".repeat(maxPrecisionLength) + value.toString()).slice(
        -maxPrecisionLength
      )
    )
    .join("")
    .replace(/^0+/, "");

export const compareNumbers = (a: number[], b: number[]) =>
  a.length < b.length
    ? -1
    : a.length > b.length
    ? 1
    : arrayCompare(reverse(a), reverse(b), (x, y) =>
        x > y ? 1 : x < y ? -1 : 0
      );

export const numbersEqual = (a: number[], b: number[]) => arrayEquals(a, b);

export const compareScore = (a: string, b: string) =>
  compareNumbers(scoreToNumbers(a), scoreToNumbers(b));
