import {
  Body,
  Controller,
  Post,
  Request
} from '@nestjs/common';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CryptoUtil } from '@utils/crypto.util';
import { IAdmin } from 'src/module/admin/interfaces/admin.interfaces';
import { AdminService } from 'src/module/admin/admin.service';

@ApiUseTags('cms/login')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('cms')
export class CMSLoginController {
  constructor(
    private adminService: AdminService,
    private readonly cryptoUtil: CryptoUtil,
  ) { }
  /*
  * 用户登录成功后，返回的 data 是授权令牌；
  * 在调用有 @UseGuards(AuthGuard()) 注解的路由时，会检查当前请求头中是否包含 Authorization: Bearer xxx 授权令牌，
  * 其中 Authorization 是用于告诉服务端本次请求有令牌，并且令牌前缀是 Bearer，而令牌的具体内容是登录之后返回的 data(accessToken)。
  */
  @Post('/login')
  @ApiOkResponse({
    description: '登录成功',
  })
  @ApiOperation({ title: '登录', description: '登录' })
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Request() req, ): Promise<any> {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    const admin: IAdmin = await this.adminService.login(username, password, clientIp);
    return { statusCode: 200, msg: '登录成功', data: admin };
  }

}