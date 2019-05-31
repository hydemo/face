import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request } from '@nestjs/common';

import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from 'src/module/role/role.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { CreateRoleDTO, RoleDTO } from 'src/module/role/dto/role.dto';

@ApiUseTags('cms/roles')

@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('cms/roles')
export class CMSRoleController {
  constructor(
    @Inject(RoleService) private roleService: RoleService,
  ) { }

  @ApiOkResponse({
    description: '物业管理列表',
    isArray: true,
  })
  @Get('/managements')
  @ApiOperation({ title: '物业管理列表', description: '物业管理列表' })
  managements(
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return this.roleService.findManagements(pagination);
  }

  @ApiOkResponse({
    description: '删除物业',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除物业', description: '删除物业' })
  deleteManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    return this.roleService.deleteManagement(id);
  }

  @ApiOkResponse({
    description: '删除物业',
  })
  @Post('/')
  @ApiOperation({ title: '删除物业', description: '删除物业' })
  addManagement(
    @Body() role: CreateRoleDTO,
    @Request() req: any,
  ) {
    const createRole: RoleDTO = {
      ...role,
      role: 1
    }
    return this.roleService.create(createRole);
  }

}