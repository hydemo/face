import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsPositive, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '区域名称' })
  readonly name: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '所属地区' })
  readonly location: string;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '区域类型' })
  readonly zoneType: number;
}

export class ZoneDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '区域名称' })
  readonly name: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '所属地区' })
  readonly location: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiModelProperty({ description: '区域级别' })
  readonly zoneLayer: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '区域类型' })
  readonly zoneType: number;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域ID' })
  readonly zoneId?: string;

  @IsMongoId()
  @IsOptional()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '父级区域' })
  readonly parent: string | null;

  @IsBoolean()
  @Type(() => String)
  @ApiModelProperty({ description: '是否有下级区域' })
  readonly hasChildren?: boolean;

  @IsMongoId()
  @IsArray()
  @ApiModelProperty({ description: '子级' })
  readonly children?: string[] = [];

  @IsMongoId()
  @IsArray()
  @ApiModelProperty({ description: '父级' })
  readonly ancestor?: string[] = [];

  @IsBoolean()
  @IsOptional()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '是否启用' })
  readonly enable?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  @ApiModelPropertyOptional({ description: '是否删除' })
  readonly isDelete?: boolean;

  houseNumber: string;
}



