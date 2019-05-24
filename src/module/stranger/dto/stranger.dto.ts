import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatAttributeDTO } from './attribute.dto';

export class CreateStrangerDTO {
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

  @ValidateNested()
  @Type(() => CreatAttributeDTO)
  @ApiModelProperty({ description: '人脸属性' })
  readonly attribute: CreatAttributeDTO;
}



