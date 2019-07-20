import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsDate, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatAttributeDTO } from './attribute.dto';

export class CreateOrbitDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '设备' })
  readonly device: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '通过时间' })
  readonly passTime: Date;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '比对结果' })
  readonly compareResult: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '抓拍图片' })
  readonly imgUrl: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸背景图片数据' })
  readonly imgexUrl?: string;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '访问次数' })
  readonly visitCount: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '人脸质量' })
  readonly faceQuality: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸特征值' })
  readonly faceFeature: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '类型' })
  readonly mode: number;

  @ValidateNested()
  @Type(() => CreatAttributeDTO)
  @ApiModelProperty({ description: '人脸属性' })
  readonly attribute: CreatAttributeDTO;

  isZOCPush?: boolean;
  // 智能感知平台包名
  ZOCZip?: string;
  upTime?: number;
}



