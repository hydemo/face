import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '区域名' })
  readonly zoneName: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '登录名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '密码' })
  readonly password: string;
}

export class MediaLoginDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '登录名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '密码' })
  readonly password: string;
}




