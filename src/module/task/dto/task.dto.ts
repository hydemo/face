import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '安装人员' })
  readonly installer: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '安装地点' })
  readonly position: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '安装截止日期' })
  readonly expireTime: Date;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域ID' })
  readonly zone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '安装位置描述' })
  readonly description: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '设备id' })
  readonly device: string;
}




