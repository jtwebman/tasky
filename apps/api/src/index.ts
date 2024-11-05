import fs from 'node:fs';
import stoppable from 'stoppable';
import { getLogger } from '@tasky/logger';
import { getConfig } from './config';
import { getContext } from './context';
import { getApp } from './app';

const killSignals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
};

getConfig()
  .then((config) => {
    return getContext(config, getLogger(config.name, config.version, config.logLevel));
  })
  .then((context) => {
    const nodeApp = stoppable(
      getApp(context).listen(context.config.port, () =>
        context.logger.info(`Node app listening on port ${context.config.port}!`),
      ),
    );

    function shutdown(signal: 'SIGHUP' | 'SIGINT' | 'SIGTERM', value: number) {
      console.log(`Trying shutdown by got ${signal}`);
      nodeApp.stop(() => {
        console.log('Node app stopped.');
        process.exit(128 + value);
      });
    }

    process.on('SIGHUP', () => shutdown('SIGHUP', killSignals.SIGHUP));
    process.on('SIGINT', () => shutdown('SIGINT', killSignals.SIGINT));
    process.on('SIGTERM', () => shutdown('SIGTERM', killSignals.SIGTERM));
  });
