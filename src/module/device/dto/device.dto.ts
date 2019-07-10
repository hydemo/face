import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeviceDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '设备用户名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '设备密码' })
  readonly password: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '设备uuid' })
  readonly deviceUUID: string;

  @IsNumber()
  @IsEnum([1, 2])
  @Type(() => Number)
  @ApiModelPropertyOptional({ description: '设备类型' })
  readonly deviceType: number;

  @IsNumber()
  @IsEnum([1, 2])
  @Type(() => Number)
  @ApiModelPropertyOptional({ description: '通行类型' })
  readonly passType: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '算法版本' })
  readonly algorithmVersion: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '模型版本' })
  readonly modelVersion: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '软件内核版本' })
  readonly softwardVersion: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '安装位置描述' })
  readonly description: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '安装区域' })
  readonly zone: string

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '安装具体区域' })
  readonly position: string


}

export class BindSimDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: 'sim卡ID' })
  readonly simId: string;
}



