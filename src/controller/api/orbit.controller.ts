import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Inject, Request } from '@nestjs/common';

import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { MongodIdPipe } from '../../common/pipe/mongodId.pipe';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { CreateUserDTO, RegisterUserDTO, LoginUserDTO, VerifyUserDTO } from 'src/module/users/dto/users.dto';
import { UserService } from 'src/module/users/user.service';
import { PhonePipe } from 'src/common/pipe/phone.pipe';
import { LoginDTO } from 'src/module/users/dto/login.dto';

@ApiUseTags('users')

@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), RolesGuard)
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

  @Post('/verify')
  @ApiOkResponse({
    description: '实名认证',
  })
  @ApiOperation({ title: '实名认证', description: '实名认证' })
  async verify(
    @Body() verify: VerifyUserDTO,
    @Request() req: any
  ) {
    await this.userService.verify(verify, req.user)
    return { statusCode: 200, msg: '验证码已发送' };
  }

  // @Roles('1')
  // @Delete('/:id')
  // @ApiOkResponse({
  //   description: '删除设备成功',
  // })
  // @ApiOperation({ title: '删除设备', description: '删除设备' })
  // async delete(@Param('id', new MongodIdPipe()) id: string) {
  //   await this.deviceService.deleteById(id);
  //   return { statusCode: 200, msg: '删除设备成功' };
  // }
}