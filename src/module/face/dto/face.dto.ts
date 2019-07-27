import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsPositive, IsBoolean, IsOptional, IsArray, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaceDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '设备' })
  readonly device: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '绑定id' })
  readonly bondToObjectId: string;

  readonly bondType: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '类型' })
  readonly mode: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '库索引' })
  readonly libIndex?: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '图片索引' })
  readonly flieIndex?: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '图片名' })
  readonly pic?: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  expire?: Date;

  readonly checkResult: number;

  // 人脸链接
  // readonly faceUrl: string;
}