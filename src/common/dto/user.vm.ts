import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class UserVm {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  username: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  surname: string;
}
