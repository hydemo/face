import { ApiModelProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '联系人' })
  readonly contact: string;
}


export class CreateContactByScanDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '二维码' })
  readonly key: string;
}



