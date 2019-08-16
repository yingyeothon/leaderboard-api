import { ConsoleLogger } from "@yingyeothon/logger";
import timespan from "time-span";
import envars from "./envars";

const logger = new ConsoleLogger(
  envars.logging.debug || envars.logging.elapsed ? `debug` : `info`
);

const elapsed = <ArgumentTypes extends unknown[], ReturnType>(
  name: string,
  func: (...args: ArgumentTypes) => ReturnType
): ((...args: ArgumentTypes) => ReturnType) => {
  return (...args: ArgumentTypes): ReturnType => {
    const span = timespan();
    const finish = (result: ReturnType) => {
      logger.debug(`Elapsed[${name}]`, span());
      return result;
    };
    const fail = (error: Error) => {
      logger.debug(`Elapsed[${name}]`, span(), `withError`, error);
      throw error;
    };
    try {
      const result = func(...args);
      return result instanceof Promise
        ? (result.then(finish).catch(fail) as any)
        : finish(result);
    } catch (error) {
      fail(error);
    }
  };
};

export default elapsed;
