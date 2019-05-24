import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  FileInterceptor,
  UploadedFile,
} from '@nestjs/common';

import { Pagination } from '@common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiConsumes,
  ApiImplicitFile,
} from '@nestjs/swagger';
import { MongodIdPipe } from '@common/pipe/mongodId.pipe';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@common/guard/roles.guard';
import { Roles } from '@common/decorator/roles.decorator';
import { ApiException } from '@common/expection/api.exception';
import { ApiErrorCode } from '@common/enum/api-error-code.enum';
import { CryptoUtil } from '@utils/crypto.util';
import { CreateAdminDTO } from 'src/module/admin/dto/admin.dto';
import { AdminService } from 'src/module/admin/admin.service';

@ApiUseTags('admin')
@UseGuards(AuthGuard(), RolesGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('cms/admin')
export class CMSAdminController {
  constructor(
    private adminService: AdminService,
    private readonly cryptoUtil: CryptoUtil,
  ) { }

  @ApiOkResponse({
    description: '获取cms账号列表列表成功',
    isArray: true,
  })
  @Get('/')
  @Roles('0')
  @ApiOperation({ title: '获取cms账号列表', description: '获取cms账号列表' })
  adminList(@Query() pagination: Pagination) {
    return this.adminService.findAll(pagination);
  }

  @Roles('0')
  @Post('/')
  @ApiOkResponse({
    description: '添加用户成功',
  })
  @ApiOperation({ title: '添加用户', description: '添加用户' })
  async create(@Body() creatAdminDTO: CreateAdminDTO) {
    await this.adminService.create(creatAdminDTO);
    return { statusCode: 200, msg: '添加用户成功 ' };
  }

  @Get('/me')
  @ApiOkResponse({
    description: '获取当前用户信息',
  })
  @ApiOperation({ title: '获取当前用户信息', description: '获取当前用户信息' })
  async getMe(@Request() req) {
    return { statusCode: 200, data: req.user };
  }

  // @Put('/me')
  // @ApiOkResponse({
  //   description: '修改当前用户信息',
  // })
  // @ApiOperation({ title: '修改当前用户信息', description: '修改当前用户信息' })
  // async updateMe(
  //   @Request() req,
  //   @Body() creatAdminDTO: CreateAdminDTO) {
  //   await this.adminService.updateMe(req.user._id, creatAdminDTO);
  //   return { statusCode: 200, msg: '修改用户成功 ' };
  // }

  @Roles('0')
  @Put('/:id')
  @ApiOkResponse({
    description: '修改用户成功',
  })
  @ApiOperation({ title: '修改用户', description: '修改用户' })
  async update(@Param('id', new MongodIdPipe()) id: string, @Body() creatAdminDTO: CreateAdminDTO) {
    await this.adminService.updateById(id, creatAdminDTO);
    return { statusCode: 200, msg: '修改用户成功 ' };
  }

  @Roles('0')
  @Delete('/:id')
  @ApiOkResponse({
    description: '删除用户成功',
  })
  @ApiOperation({ title: '删除用户', description: '删除用户' })
  async delete(@Param('id', new MongodIdPipe()) id: string) {
    await this.adminService.deleteById(id);
    return { statusCode: 200, msg: '删除用户成功 ' };
  }

  @Roles('0')
  @Put('/:id/recover')
  @ApiOkResponse({
    description: '恢复已删除用户成功',
  })
  @ApiOperation({ title: '恢复已删除用户', description: '恢复已删除用户' })
  async recover(@Param('id', new MongodIdPipe()) id: string) {
    await this.adminService.recover(id);
    return { statusCode: 200, msg: '恢复已删除用户成功 ' };
  }

  @Roles('0')
  @Put('/:id/password')
  @ApiOkResponse({
    description: '修改用户密码成功',
  })
  @ApiOperation({ title: '修改密码', description: '修改密码' })
  async resetPassWord(@Param('id', new MongodIdPipe()) id: string, @Body('password') password: string) {
    await this.adminService.resetPassword(id, password);
    return { statusCode: 200, msg: '修改用户密码成功 ' };
  }



  @Put('/password/me')
  @ApiOkResponse({
    description: '修改用户密码成功',
  })
  @ApiOperation({ title: '修改密码', description: '修改密码' })
  async resetPassWordMe(
    @Request() req,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string) {
    if (!this.cryptoUtil.checkPassword(oldPassword, req.user.password)) {
      throw new ApiException('密码有误', ApiErrorCode.PASSWORD_INVALID, 406);
    }
    await this.adminService.resetPassword(req.user._id, newPassword);
    return { statusCode: 200, msg: '修改用户密码成功' };
  }
}