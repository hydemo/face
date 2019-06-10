import {
  Controller,
  Request,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WeixinUtil } from 'src/utils/weixin.util';
import { UserService } from 'src/module/users/user.service';

@ApiUseTags('weixin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('/weixin')
export class WeixinController {
  constructor(
    private readonly weixinUtil: WeixinUtil,
    private readonly userService: UserService,
  ) { }

  @ApiOkResponse({
    description: '微信签名',
  })
  @Get('/sign')
  @UseGuards(AuthGuard())
  @ApiOperation({ title: '微信签名', description: '微信签名' })
  async sign(
    @Query('url') url: string,
  ) {
    const data = await this.weixinUtil.sign(url)
    return { status: 200, data }
  }

  @ApiOkResponse({
    description: '微信签名',
  })
  @Get('/scan')
  @UseGuards(AuthGuard())
  @ApiOperation({ title: '微信签名', description: '微信签名' })
  async scan(
    @Query('key') key: string,
  ) {
    const data = await this.weixinUtil.scan(key)
    return { status: 200, data }
  }

  @ApiOkResponse({
    description: '微信签名',
  })
  @Get('/oauth')
  @ApiOperation({ title: '微信签名', description: '微信签名' })
  async OAuth(
    @Query('code') code: string,
    @Request() req: any
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    const data = await this.userService.OAuth(code, clientIp);
    console.log(data, 'data')
    if (data) {
      return { status: 200, data }
    }
    return { status: 400, msg: '授权失败' }
  }
}