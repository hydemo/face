import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, ValidateNested, IsBoolean } from 'class-validator';
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




