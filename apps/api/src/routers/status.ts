import express, { NextFunction, Request, Response } from 'express';
import { IContext } from '../context';

export function getStatusRouter(context: IContext) {
  const router = express.Router();

  router.get('/', (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json({
        status: 'OK',
        name: context.config.name,
        version: context.config.version,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
