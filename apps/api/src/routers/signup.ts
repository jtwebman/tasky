import express, { NextFunction, Request, Response } from 'express';
import { IContext } from '../context';
import { signup } from '../app/user';

export function getSignupRouter(context: IContext) {
  const router = express.Router();

  router.post('/', express.json(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await signup(context, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
