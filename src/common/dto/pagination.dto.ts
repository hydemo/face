import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class Pagination {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiModelPropertyOptional({ type: Number, example: 1 })
  @Type(() => Number)
  readonly offset: number = 1;
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiModelPropertyOptional({ type: Number, example: 10 })
  @Type(() => Number)
  readonly limit: number = 10;

  @IsString()
  readonly search?: string;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @ApiModelPropertyOptional({ description: '搜索参数' })
  readonly value?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @ApiModelPropertyOptional({ description: '区域类型' })
  readonly type?: number;

  @IsMongoId()
  @Type(() => String)
  @IsOptional()
  @ApiModelPropertyOptional({ description: '区域id' })
  readonly zone?: string;

  @IsMongoId()
  @Type(() => String)
  @IsOptional()
  @ApiModelPropertyOptional({ description: '地址id' })
  readonly address?: string;
}
