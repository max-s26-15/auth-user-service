import { Request } from 'express';
import { IUserPayload } from './user-payload.interface';

export interface IUserReq extends Request {
  user: IUserPayload;
}
