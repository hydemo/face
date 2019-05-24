import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UserInfoDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '昵称' })
  readonly nickName: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '头像' })
  readonly avatarUrl: string;

  @IsNumber()
  @IsEnum([0, 1, 2])
  @Type(() => String)
  @ApiModelProperty({ description: '性别' })
  readonly gender: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '国家' })
  readonly country: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '省份' })
  readonly province: string;

  @IsString()
  @IsEnum(['en', 'zh_CN', 'zh_TW'])
  @Type(() => String)
  @ApiModelProperty({ description: '语言' })
  readonly city: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '头像' })
  readonly language: string;
}