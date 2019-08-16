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
  eq: (a: T, b: T) => boolean = (x, y) => x === y
) =>
  !!a &&
  !!b &&
  a.length === b.length &&
  a.every((value, index) => eq(value, b[index]));

export const lowerBound = <T>(
  values: T[],
  target: T,
  compare: (a: T, b: T) => number
): number => {
  let left = 0;
  let right = values.length;
  while (left + 1 <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const compared = compare(values[mid], target);
    if (compared < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
};
