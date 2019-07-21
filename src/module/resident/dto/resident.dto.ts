import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDate, IsBoolean, IsEnum, IsNumber, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VerifyUserDTO } from 'src/module/users/dto/users.dto';

export class ResidentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '审核人' })
  readonly reviewer?: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '归属人' })
  readonly owner: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况' })
  readonly checkResult: number;

  @IsString()
  @IsEnum(['owner', 'visitor', 'family'])
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

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly checkTime?: Date;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否出租' })
  readonly isRent?: boolean;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly expireTime?: Date;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isPush?: boolean;
}

export class CreateResidentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;
}

export class CreateFamilyDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;

  @ValidateNested()
  @Type(() => VerifyUserDTO)
  @ApiModelProperty({ description: '用户' })
  readonly user: VerifyUserDTO;
}

export class CreateFamilyByScanDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否推送' })
  readonly isPush: boolean;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'key' })
  readonly key: string;
}

export class CreateVisitorByScanDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'key' })
  readonly key: string;
}

export class CreateVisitorByOwnerDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'key' })
  readonly key: string;

  @IsNumber()
  @Type(() => Number)
  @Max(7)
  @ApiModelProperty({ description: '申请时间' })
  readonly expireTime: number;
}

export class AgreeVisitorDTO {
  @IsNumber()
  @Type(() => Number)
  @Max(7)
  @ApiModelProperty({ description: '申请时间' })
  readonly expireTime: number;
}

export class AgreeFamilyDTO {
  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isPush: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;
}

export class UpdateFamilyDTO {
  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isPush: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否监控' })
  readonly isMonitor: boolean;

  @ValidateNested()
  @Type(() => VerifyUserDTO)
  @ApiModelProperty({ description: '用户' })
  readonly user: VerifyUserDTO;
}





