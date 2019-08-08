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
import { CreateRoleByScanDTO } from 'src/module/role/dto/role.dto';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';
import { UserRoles } from 'src/common/decorator/roles.decorator';
import { ResidentService } from 'src/module/resident/resident.service';

@ApiUseTags('roles')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), UserRolesGuard)
@Controller('api/roles')
export class RoleController {
  constructor(
    @Inject(RoleService) private roleService: RoleService,
    @Inject(ResidentService) private residentService: ResidentService,
  ) { }

  @ApiOkResponse({
    description: '管理人员列表',
    isArray: true,
  })
  @Get('/')
  @UserRoles(1)
  @ApiOperation({ title: '管理人员列表', description: '管理人员列表' })
  async managements(
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return await this.roleService.findByManagement(pagination, req.user._id);
  }

  @ApiOkResponse({
    description: '民警列表',
    isArray: true,
  })
  @Get('/police')
  @UserRoles(1)
  @ApiOperation({ title: '民警列表', description: '民警列表' })
  async polices(
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return await this.roleService.polices(pagination, req.user._id);
  }

  @Get('/tail')
  @UserRoles(1)
  @ApiOperation({ title: '尾部补全', description: '尾部补全' })
  async getTail(
    @Query('skip') skip: number,
    @Query('zone') zone: string,
    @Request() req: any,
  ) {
    const data = await this.roleService.getTail(skip, zone, req.user._id);
    return { statusCode: 200, data };

  }

  @ApiOkResponse({
    description: '删除工作人员',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除工作人员', description: '删除工作人员' })
  async deleteManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
    @Body() body: { skip: number },
  ) {
    await this.roleService.delete(id, req.user._id);
    return { statusCode: 200, msg: '删除工作人员成功' };

  }

  @ApiOkResponse({
    description: '删除民警',
  })
  @Delete('/:id/police')
  @ApiOperation({ title: '删除民警', description: '删除民警' })
  async deletePolice(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.roleService.deletePolice(id, req.user._id);
    return { statusCode: 200, msg: '删除民警' };

  }

  @ApiOkResponse({
    description: '扫码添加工作人员',
  })
  @Post('/scan')
  @ApiOperation({ title: '扫码添加工作人员', description: '扫码添加工作人员' })
  async addManagement(
    @Body() role: CreateRoleByScanDTO,
    @Request() req: any,
  ) {
    await this.roleService.createByScan(role, req.user._id);
    return { statusCode: 200, msg: '添加成功' };
  }

  @ApiOkResponse({
    description: '扫码添加民警',
  })
  @Post('/scan/police')
  @ApiOperation({ title: '扫码添加民警', description: '扫码添加民警' })
  async addPolice(
    @Body() key: CreateRoleByScanDTO,
    @Request() req: any,
  ) {
    await this.roleService.createPoliceByScan(key.key, req.user._id);
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
    const applications = await this.residentService.findByCondition({ user: req.user._id })
    const myHouses = await this.residentService.getMyHouses(req.user._id)
    const owner = await this.residentService.getMyOwnerHouses(req.user._id)
    const data = await this.roleService.myRoles(req.user._id);
    const police = await this.roleService.getPoliceArea(req.user._id)
    return { statusCode: 200, data: { ...data, police, hasApplication: applications.length > 0, isFamily: myHouses.length > 0, owner } };
  }
}