import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAreaDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '片区名称' })
  readonly name: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '省份' })
  readonly provianc: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '城市' })
  readonly city: string;
}




