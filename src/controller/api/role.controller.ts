import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request } from '@nestjs/common';

import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from 'src/module/role/role.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { CreateRoleDTO, RoleDTO, CreateRoleByScanDTO } from 'src/module/role/dto/role.dto';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';
import { UserRoles } from 'src/common/decorator/roles.decorator';

@ApiUseTags('roles')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), UserRolesGuard)
@Controller('api/roles')
export class RoleController {
  constructor(
    @Inject(RoleService) private roleService: RoleService,
  ) { }

  @ApiOkResponse({
    description: '管理人员列表',
    isArray: true,
  })
  @Get('/')
  @UserRoles(1)
  @ApiOperation({ title: '管理人员列表', description: '管理人员列表' })
  managements(
    @Request() req: any,
  ) {
    return this.roleService.findByManagement(req.user._id);
  }

  @ApiOkResponse({
    description: '删除工作人员',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除工作人员', description: '删除工作人员' })
  async deleteManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.roleService.delete(id, req.user._id);
    return { statusCode: 200, msg: '删除工作人员成功' };

  }

  @ApiOkResponse({
    description: '扫码添加工作人员',
  })
  @Post('/scan')
  @ApiOperation({ title: '扫码添加工作人员', description: '扫码添加工作人员' })
  async addManagement(
    @Body() role: CreateRoleByScanDTO,
  ) {
    await this.roleService.createByScan(role);
    return { statusCode: 200, msg: '添加成功' };
  }

  @ApiOkResponse({
    description: '获取我的角色',
  })
  @Get('/me')
  @ApiOperation({ title: '获取我的角色', description: '获取我的角色' })
  async myRole(
    @Request() req: any,
  ) {
    const data = await this.roleService.myRoles(req.user._id);
    return { statusCode: 200, data };
  }

}