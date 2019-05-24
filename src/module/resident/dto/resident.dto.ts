import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDate, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ResidentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域ID' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况' })
  readonly checkResult: number;

  @IsString()
  @IsEnum(['owner', 'tenant', 'family'])
  @Type(() => String)
  @ApiModelProperty({ description: '住客类型' })
  readonly type: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '添加时间' })
  readonly addTime?: Date;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly applicationTime: Date;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;
}

export class CreateResidentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域ID' })
  readonly zone: string;
}




