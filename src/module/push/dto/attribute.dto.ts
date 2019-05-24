import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatAttributeDTO {

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '年龄' })
  readonly age: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '性别 1:男 2:女' })
  readonly gender: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '是否佩戴眼镜 0:否 1:戴眼镜 2:戴太阳镜' })
  readonly glasses: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '是否戴面具 0:否 1:是' })
  readonly mask: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '是否留胡子 0:否 1:是' })
  readonly beard: number;

  @IsNumber()
  @Type(() => Number)
  @ApiModelProperty({ description: '人种 1:黄种人 2:黑种人 3:白种人' })
  readonly race: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiModelProperty({ description: '情绪 1:生气 2:平静 3:高兴 4:悲伤 5:惊讶' })
  readonly emotion?: number;
}



