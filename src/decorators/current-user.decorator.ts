import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserPayload, IUserReq } from '../types';

export const CurrentUser = createParamDecorator(
  async (data: unknown, context: ExecutionContext): Promise<IUserPayload> => {
    const request = context?.switchToHttp().getRequest<IUserReq>();

    const { id, username } = request.user;

    return { id, username };
  },
);
