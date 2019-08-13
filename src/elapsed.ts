import * as timespan from "time-span";

export const n = <R>(name: string, func: () => R): R => {
  const span = timespan();
  try {
    const result = func();
    console.log(`Elapsed[${name}]`, span());
    return result;
  } catch (error) {
    console.log(`Elapsed[${name}]`, span(), `withError`, error);
    throw error;
  }
};

export const p = async <R>(
  name: string,
  generator: () => Promise<R>
): Promise<R> => {
  const span = timespan();
  try {
    const result = await generator();
    console.log(`Elapsed[${name}]`, span());
    return result;
  } catch (error) {
    console.log(`Elapsed[${name}]`, span(), `withError`, error);
    throw error;
  }
};
