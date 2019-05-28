import { Body, Controller, Get, Post, Query, UseGuards, Inject, Request, Put } from '@nestjs/common';

import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RegisterUserDTO, LoginUserDTO, VerifyUserDTO, ForgetPasswordDTO, BindPhoneDTO, ResetPasswordDTO } from 'src/module/users/dto/users.dto';
import { UserService } from 'src/module/users/user.service';
import { PhonePipe } from 'src/common/pipe/phone.pipe';

@ApiUseTags('users')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/users')
export class UserController {
  constructor(
    @Inject(UserService) private userService: UserService,
  ) { }

  @Post('/login')
  @ApiOkResponse({
    description: '注册',
  })
  @ApiOperation({ title: '注册', description: '注册' })
  async login(
    @Body() user: LoginUserDTO,
    @Request() req: any
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    const data = await this.userService.login(user, clientIp)
    return { statusCode: 200, msg: '登录成功', data };
  }

  @Post('/register')
  @ApiOkResponse({
    description: '注册',
  })
  @ApiOperation({ title: '注册', description: '注册' })
  async create(
    @Body() user: RegisterUserDTO,
    @Request() req: any
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    await this.userService.register(user, clientIp)
    return { statusCode: 200, msg: '注册成功' };
  }

  @Get('/code')
  @ApiOkResponse({
    description: '注册',
  })
  @ApiOperation({ title: '注册', description: '注册' })
  async getCode(
    @Query('phone', new PhonePipe()) phone: string,
    @Request() req: any
  ) {
    await this.userService.getCode(phone)
    return { statusCode: 200, msg: '验证码已发送' };
  }

  @Get('/qrcode')
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: '获取我的二维码',
  })
  @ApiOperation({ title: '获取我的二维码', description: '获取我的二维码' })
  async genQrcode(
    @Request() req: any
  ) {
    const data = await this.userService.genQrcode(req.user)
    return { statusCode: 200, data };
  }

  @Get('/check/phone')
  @ApiOkResponse({
    description: '手机校验',
  })
  @ApiOperation({ title: '手机校验', description: '手机校验' })
  async phoneCheck(
    @Query('phone', new PhonePipe()) phone: string,
    @Request() req: any
  ) {
    const data: boolean = await this.userService.phoneCheck(phone)
    return { statusCode: 200, data };
  }

  @Get('/check/code')
  @ApiOkResponse({
    description: '验证码校验',
  })
  @ApiOperation({ title: '验证码校验', description: '验证码校验' })
  async codeCheck(
    @Query('code') code: string,
    @Query('phone', new PhonePipe()) phone: string,
    @Request() req: any
  ) {
    await this.userService.codeCheck(phone, code)
    return { statusCode: 200, data: true };
  }

  @Put('/verify')
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: '实名认证',
  })
  @ApiOperation({ title: '实名认证', description: '实名认证' })
  async verify(
    @Body() verify: VerifyUserDTO,
    @Request() req: any
  ) {
    await this.userService.verify(verify, req.user)
    return { statusCode: 200, msg: '实名认证成功' };
  }

  @Put('/password/forget')
  @ApiOkResponse({
    description: '忘记密码',
  })
  @ApiOperation({ title: '忘记密码', description: '忘记密码' })
  async forgetPassword(
    @Body() resetPassword: ForgetPasswordDTO,
  ) {
    await this.userService.forgetPassword(resetPassword)
    return { statusCode: 200, msg: '重置成功' };
  }

  @Put('/password/reset')
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: '忘记密码',
  })
  @ApiOperation({ title: '忘记密码', description: '忘记密码' })
  async resetPassword(
    @Body() reset: ResetPasswordDTO,
    @Request() req: any
  ) {
    await this.userService.resetPassword(req.user, reset)
    return { statusCode: 200, msg: '忘记密码' };
  }

  @Put('/bind/phone')
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: '绑定手机号',
  })
  @ApiOperation({ title: '绑定手机号', description: '绑定手机号' })
  async bindPhone(
    @Body() bind: BindPhoneDTO,
    @Request() req: any
  ) {
    await this.userService.bindPhone(req.user, bind)
    return { statusCode: 200, msg: '绑定手机号成功' };
  }
}