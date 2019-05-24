import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNumber, IsPositive, IsPhoneNumber, IsMobilePhone, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '用户名' })
  readonly username?: string;

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '密码' })
  password: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '注册时间' })
  readonly registerTime: Date;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '注册ip' })
  readonly registerIp: string;


  @IsBoolean()
  @Type(() => Boolean)
  @ApiModelProperty({ description: '是否手机认证' })
  readonly isPhoneVerify: boolean;
}

export class RegisterUserDTO {

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '密码' })
  password: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone: string;

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '验证码' })
  code: string;

}

export class LoginUserDTO {

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '密码' })
  readonly password: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone: string;

}

export class VerifyUserDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '用户名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸' })
  readonly faceUrl?: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '头像' })
  readonly cardNumber: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone?: string;

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '验证码' })
  code?: string;
}

export class ForgetPasswordDTO {
  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '密码' })
  readonly password: string;

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '验证码' })
  readonly code: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone: string;
}

export class ResetPasswordDTO {
  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '新密码' })
  readonly newpassword: string;

  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '旧密码' })
  readonly oldPassword: string;
}

export class BindPhoneDTO {
  @IsString()
  @Type(() => String)
  @ApiModelPropertyOptional({ description: '验证码' })
  readonly code: string;

  @IsMobilePhone('zh-CN')
  @Type(() => String)
  @ApiModelProperty({ description: '手机号' })
  readonly phone: string;
}


