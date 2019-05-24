import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, IsMongoId, IsMobilePhone } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdminDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '昵称' })
  readonly nickname: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '角色' })
  readonly role: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '密码' })
  password: string;


  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '联系电话' })
  readonly phone?: string;

  @IsString()
  @ApiModelProperty({ description: '头像' })
  readonly avatar?: string;
}

export class UpdateAdminRoleDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '角色' })
  readonly role: string;
}

export class UpdateAdminPassDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '密码' })
  password: string;
}

export class UpdateAdminPhoneDTO {
  @IsString()
  @IsPhoneNumber('CH')
  @Type(() => String)
  @ApiModelProperty({ description: '联系电话' })
  readonly phone: string;
}

export class UpdateAdminDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '昵称' })
  readonly nickname?: string;

  @IsString()
  @ApiModelProperty({ description: '头像' })
  readonly avatar?: string;
}
