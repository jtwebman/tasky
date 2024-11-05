import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface RequestWithLogger extends Request {
  id: string;
  logger: ILogger;
}

export interface ResponseLoggable extends Response {
  startTime: number;
}

declare module 'http' {
  interface IncomingMessage {
    id: string;
    logger: ILogger;
  }

  interface ServerResponse {
    err?: Error | undefined;
  }

  interface OutgoingMessage {
    startTime: number;
  }
}

export interface ILoggerExtra {
  [k: string]: string | number | boolean | undefined | null;
}

export interface ILogger {
  /**
   * Used to add trace logs if logging at the trace level.
   * @param text - A string message for the logs
   * @param extra - An object of string properties to be added to the json logs
   */
  trace: (text: string, extra?: ILoggerExtra) => void;
  /**
   * Used to add debug logs if logging at the debug level.
   * @param text - A string message for the logs
   * @param extra - An object of string properties to be added to the json logs
   */
  debug: (text: string, extra?: ILoggerExtra) => void;
  /**
   * Used to add info logs if logging at the info level.
   * @param text - A string message for the logs
   * @param extra - An object of string properties to be added to the json logs
   */
  info: (text: string, extra?: ILoggerExtra) => void;
  /**
   * Used to add warn logs if logging at the warn level.
   * @param text - A string message for the logs
   * @param extra - An object of string properties to be added to the json logs
   */
  warn: (text: string, extra?: ILoggerExtra) => void;
  /**
   * Used to add error logs.
   * @param text - A string message for the logs or a Javascript Error
   * @param extra  - An object of string properties to be added to the json logs
   */
  error: (error: string | Error, extra?: ILoggerExtra) => void;
  /**
   * Get the logger under the hood. Do not use in service code!
   * @returns - Returns the hidden logger under the hood.
   */
  getLogger: () => any;
}

export type LoggerMiddleware = (req: RequestWithLogger, res: ResponseLoggable, next: NextFunction) => void;

function wrapLogger(logger: pino.Logger<never, boolean>): ILogger {
  return {
    trace: (text: string = '', extra: ILoggerExtra = {}) => {
      return logger.trace(extra, text);
    },
    debug: (text: string = '', extra: ILoggerExtra = {}) => {
      return logger.debug(extra, text);
    },
    info: (text: string = '', extra: ILoggerExtra = {}) => {
      return logger.info(extra, text);
    },
    warn: (text: string = '', extra: ILoggerExtra = {}) => {
      return logger.warn(extra, text);
    },
    error: (error: string | Error = '', extra: ILoggerExtra = {}) => {
      if (error instanceof Error) {
        return logger.error({ ...extra, stack: error.stack }, error.message);
      }
      return logger.error(extra, error);
    },
    getLogger: () => logger,
  };
}

/**
 * Get a json logger that outputs to standard out
 * @param name - The service name
 * @param version - The service version
 * @param level - The log level to write out and above
 * @returns - The logger
 */
export function getLogger(name: string, version: string, level: LogLevel = 'info'): ILogger {
  const logger = pino({
    name,
    level,
  });
  const versionedLogger = logger.child({ version });
  return wrapLogger(versionedLogger);
}

/**
 * Get Express middleware that attaches a request logger
 * @param logger - The logger you got from getLogger
 * @param level - the log level to use for logging requests. Defaults to 'info'
 * @returns - Returns the express middleware
 */
export function getHttpLogger(logger: ILogger): LoggerMiddleware {
  const reqId = uuidv4();
  const reqIdLogger = wrapLogger(logger.getLogger().child({ reqId }));
  return (req: RequestWithLogger, res: ResponseLoggable, next?: NextFunction) => {
    req.id = reqId;
    req.logger = reqIdLogger;

    res.startTime = res.startTime || Date.now();
    let logged = false;

    function onResponseComplete(error?: Error) {
      if (!logged) {
        logged = true;
        res.removeListener('close', onResponseComplete);
        res.removeListener('finish', onResponseComplete);
        res.removeListener('error', onResponseComplete);

        const endTime = Date.now();
        const responseTime = Date.now() - res.startTime;
        if (error) {
          reqIdLogger.error('http log', {
            startTime: res.startTime,
            endTime,
            responseTime,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            stack: error.stack,
          });
        } else {
          reqIdLogger.info('http log', {
            startTime: res.startTime,
            endTime,
            responseTime,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
          });
        }
      }
    }

    res.on('close', () => onResponseComplete());
    res.on('finish', () => onResponseComplete());
    res.on('error', (error) => onResponseComplete(error));

    if (next) {
      next();
    }
  };
}
