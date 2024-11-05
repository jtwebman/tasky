import express, { NextFunction, Request, Response } from 'express';
import { getHttpLogger } from '@tasky/logger';
import { getStatusRouter } from './routers/status';
import { IContext } from './context';

export function getApp(context: IContext) {
  const app = express();

  app.disable('x-powered-by');
  app.set('etag', false);

  app.use(getHttpLogger(context.logger));

  app.use('/status', getStatusRouter(context));

  app.use((error: Error, req: Request, res: Response, _next: NextFunction): void => {
    req.logger.error(error);
    res.status(500).json({
      message: 'Bad server error, check service logs',
    });
  });

  return app;
}
