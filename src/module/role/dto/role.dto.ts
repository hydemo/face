import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '描述' })
  readonly description: string;

  reviewer: string;
}

export class RoleDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone?: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '描述' })
  readonly description: string;

  @IsNumber()
  @IsEnum([1, 2, 3, 4, 5])
  @Type(() => Number)
  @ApiModelProperty({ description: '角色' })
  readonly role: number;

  @IsNumber()
  @IsEnum([1, 2, 3, 4, 5])
  @Type(() => Number)
  @ApiModelProperty({ description: '同步结果' })
  readonly checkResult: number;

  reviewer: string;
}

export class CreateRoleByScanDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '描述' })
  readonly description: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: 'key' })
  readonly key: string;

  @IsNumber()
  @IsEnum([1, 2, 3, 4, 5])
  @Type(() => Number)
  @ApiModelProperty({ description: '角色' })
  readonly role: number;

  @IsNumber()
  @IsEnum([1, 2, 3, 4, 5])
  @Type(() => Number)
  @ApiModelProperty({ description: '同步结果' })
  readonly checkResult: number;

  reviewer: string;
}




