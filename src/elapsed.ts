import { ConsoleLogger, LogSeverity } from "@yingyeothon/logger";
import timespan from "time-span";

const logger = new ConsoleLogger(
  !!process.env.DEBUG || !!process.env.ELAPSED ? `debug` : `info`
);

export const n = <R>(name: string, func: () => R): R => {
  const span = timespan();
  try {
    const result = func();
    logger.debug(`Elapsed[${name}]`, span());
    return result;
  } catch (error) {
    logger.debug(`Elapsed[${name}]`, span(), `withError`, error);
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
    logger.debug(`Elapsed[${name}]`, span());
    return result;
  } catch (error) {
    logger.debug(`Elapsed[${name}]`, span(), `withError`, error);
    throw error;
  }
};

// Only for test logging.
export const forTest = {
  logSeverity: () => logger.severity,
  changeLogSeverity: (value: LogSeverity) => (logger.severity = value)
};
