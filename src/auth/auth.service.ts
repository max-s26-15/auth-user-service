import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}
}
