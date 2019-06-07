import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsMongoId, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class BlackDTO {
  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况 1:待审核 2:通过 3:拒绝' })
  readonly checkResult: number;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '申请人' })
  readonly applicant: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly applicationTime: Date;


  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '申请小区' })
  readonly zone: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '类型 1:监控 2:报警' })
  readonly type: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '姓名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '身份证' })
  readonly cardNumber: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '申请理由' })
  readonly reason: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸' })
  readonly faceUrl: string;
}

export class CreateBlackDTO {
  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '类型 1:监控 2:报警' })
  readonly type: number;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '姓名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '身份证' })
  readonly cardNumber: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '申请理由' })
  readonly reason: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸' })
  readonly faceUrl: string;
}
