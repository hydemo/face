import { ApiModelProperty } from '@nestjs/swagger';
import { IsMongoId, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '业主' })
  readonly owner: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '出租时间' })
  readonly rentTime: Date;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '租客' })
  readonly tenant: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '小区' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址' })
  readonly address: string;
}

export class CreateRentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '租客' })
  readonly tenant: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址' })
  readonly address: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '二维码' })
  readonly key: string;
}


