import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserInfoDTO } from './userinfo.dto';

export class LoginInfoDTO {
  @ApiModelProperty({ description: '用户信息' })
  readonly userInfo: UserInfoDTO;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'rawdata' })
  readonly rawData: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'rawdata' })
  readonly errMsg: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '签名' })
  readonly signature: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '加密数据' })
  readonly encryptedData: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '初始向量' })
  readonly iv: string;
}