import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsPositive, IsBoolean, IsOptional, IsArray, IsMobilePhone } from 'class-validator';
import { Type } from 'class-transformer';
import { ZoneProfileDTO } from './zonePrifile.dto';
import { PropertyCoDTO } from './propertyCo.dto';

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

export class CreateZoneByScanDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '区域名称' })
  readonly name: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '二维码' })
  readonly code: string;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '区域类型' })
  readonly zoneType: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '物业名称' })
  readonly propertyCoName: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '物业信用代码' })
  readonly creditCode: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '物业负责人' })
  readonly contact: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '负责人电话' })
  readonly contactPhone: string;
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
  propertyCo?: PropertyCoDTO;
  houseNumber: string;

  hasPartition?: boolean;
  detail?: any;
  profile: ZoneProfileDTO;
  // 建筑类型 50:建筑物 60:单元房 61：梯位
  buildingType: string;
  // 分区id
  partition?: string;
  // 分区排序
  partitionSort?: number;
  // 名称长度
  nameLength: number;
}



