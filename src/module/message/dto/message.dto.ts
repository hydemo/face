import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, ValidateNested, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ContentDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '类型' })
  readonly contentType: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '内容' })
  readonly content: string;
}

export class CreateOrbitMessageDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '发送人' })
  readonly sender: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '消息类型' })
  readonly type: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '接收人' })
  readonly receiver: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '轨迹' })
  readonly orbit: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '消息类型' })
  readonly zone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '消息类型' })
  readonly position: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '抓拍头像' })
  readonly imgUrl: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '抓拍原图' })
  readonly imgexUrl: string;

  @IsNumber()
  @IsEnum([1, 2])
  @Type(() => Number)
  @ApiModelProperty({ description: '通行类型' })
  readonly passType: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '比对结果' })
  readonly compareResult: number;

}

export class CreateSystemMessageDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '发送人' })
  readonly sender: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '消息类型' })
  readonly type: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '接收人' })
  readonly receiver: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '标题' })
  readonly title: string;

  @ValidateNested()
  @Type(() => ContentDTO)
  @ApiModelProperty({ description: '内容' })
  readonly content: ContentDTO;
}




