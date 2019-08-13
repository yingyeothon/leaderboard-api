export const reverse = <T>(input: T[]) => [...(input || [])].reverse();

export const arrayCompare = <T>(
  a: T[],
  b: T[],
  compare: (a: T, b: T) => number
) => {
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; ++index) {
    if (a[index] === undefined) {
      return -1;
    }
    if (b[index] === undefined) {
      return 1;
    }
    if (a[index] !== b[index]) {
      return compare(a[index], b[index]);
    }
  }
  return 0;
};

export const arrayEquals = <T>(
  a: T[],
  b: T[],
  eq: (a: T, b: T) => boolean = (a, b) => a === b
) =>
  a &&
  b &&
  a.length === b.length &&
  a.every((value, index) => eq(value, b[index]));
