import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LoginInfoDTO } from './logininfo.dto';
export class LoginDTO {
  @ValidateNested()
  @Type(() => LoginInfoDTO)
  @ApiModelProperty({ description: '登录信息' })
  readonly userInfo: any;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '授权码' })
  readonly code: string;
}