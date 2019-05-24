import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsPositive, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaceDTO {
  @IsMongoId()
  @IsOptional()
  @Type(() => String)
  @ApiModelProperty({ description: '设备' })
  readonly device: string;

  @IsMongoId()
  @IsOptional()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '类型' })
  readonly mode: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '库索引' })
  readonly libIndex: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '图片索引' })
  readonly flieIndex: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '图片名' })
  readonly pic: string;
}