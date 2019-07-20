import { Body, Controller, Get, Param, Post, Query, UseGuards, Inject, Request, Put } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { UserService } from 'src/module/users/user.service';
import { CreateUserDTO } from 'src/module/users/dto/users.dto';
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { RoleService } from 'src/module/role/role.service';
import { RoleDTO } from 'src/module/role/dto/role.dto';



@ApiUseTags('cms/users')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), RolesGuard)
@Controller('cms/users')
export class CMSUserController {
  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(RoleService) private roleService: RoleService,
  ) { }

  @ApiOkResponse({
    description: '用户列表',
    type: CreateUserDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取用户列表', description: '获取用户列表' })
  userList(@Query() pagination: Pagination) {
    return this.userService.findAll(pagination);
  }

  @Get('/:id')
  @ApiOkResponse({
    description: '获取用户成功',
  })
  @ApiCreatedResponse({ description: '获取用户' })
  @ApiOperation({ title: '根据id获取用户信息', description: '根据id获取用户信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: IUser | null = await this.userService.findById(id);
    return { statusCode: 200, msg: '获取用户成功', data };
  }

  @Put('/:id/admin')
  @ApiOkResponse({
    description: '设为管理员',
  })
  @ApiCreatedResponse({ description: '设为管理员' })
  @ApiOperation({ title: '设为管理员', description: '设为管理员' })
  async setAdmin(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any) {
    const role: RoleDTO = {
      user: id,
      description: '管理员',
      role: 0,
      checkResult: 2,
      reviewer: req.user._id
    }
    await this.roleService.create(role);
    return { statusCode: 200, msg: '设置成功' };
  }


  @Post('')
  @ApiOkResponse({
    description: '添加用户成功',
  })
  @ApiOperation({ title: '添加用户', description: '添加用户' })
  async create(
    @Body() user: CreateUserDTO,
    @Request() req: any,
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    await this.userService.createByAdmin(user, clientIp);
    return { statusCode: 200, msg: '添加用户成功' };
  }
}