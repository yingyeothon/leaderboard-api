interface ISafeIntegerGuard {
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
}

export const safeIntQueryParam = (
  params: { [name: string]: string },
  name: string,
  {
    defaultValue = 0,
    minValue = 0,
    maxValue = Number.MAX_SAFE_INTEGER
  }: ISafeIntegerGuard = {}
) =>
  Math.max(
    minValue,
    Math.min(maxValue, +((params || {})[name] || defaultValue.toString()))
  );

export const safeStringQueryParam = (
  params: { [name: string]: string },
  name: string
) => {
  const maybe = ((params || {})[name] || "").trim();
  if (!maybe) {
    throw new Error(`No query parameter [${name}]`);
  }
  return maybe;
};
