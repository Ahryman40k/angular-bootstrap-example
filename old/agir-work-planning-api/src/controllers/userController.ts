import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { AgirRequest } from '../models/requests';

@autobind
export class UserController {
  /**
   * get Current user by token
   * @param req
   * @param res
   */
  public getCurrentUser(req: AgirRequest, res: express.Response): void {
    res.status(200).send(req.user);
  }
}
export const userController: UserController = new UserController();
