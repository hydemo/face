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
import { CreateRoleByScanDTO, RoleDTO } from 'src/module/role/dto/role.dto';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';
import { UserRoles, Roles } from 'src/common/decorator/roles.decorator';
import { ResidentService } from 'src/module/resident/resident.service';
import { SchoolService } from 'src/module/school/school.service';
import { RolesGuard } from 'src/common/guard/roles.guard';

@ApiUseTags('roles')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), RolesGuard)
@Roles('0')
@Controller('cms/roles')
export class CMSRoleController {
  constructor(
    @Inject(RoleService) private roleService: RoleService,
    @Inject(ResidentService) private residentService: ResidentService,
    @Inject(SchoolService) private schoolService: SchoolService,
  ) { }

  @ApiOkResponse({
    description: '角色列表',
    isArray: true,
  })
  @Get('/')
  @UserRoles(1)
  @ApiOperation({ title: '角色列表', description: '角色列表' })
  async managements(
    @Query() pagination: Pagination,
    @Query('role') role: number,
    @Request() req: any,
  ) {
    return await this.roleService.findAll(pagination, Number(role));
  }

  @ApiOkResponse({
    description: '添加角色',
  })
  @Post('')
  @ApiOperation({ title: '添加角色', description: '添加角色' })
  async add(
    @Body() role: RoleDTO,
    @Request() req: any,
  ) {
    // console.log(role, 'role')
    await this.roleService.createByCMS(role);
    return { statusCode: 200, msg: '添加成功' };
  }


}