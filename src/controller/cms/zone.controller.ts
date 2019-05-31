import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject } from '@nestjs/common';
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
import { ZoneService } from 'src/module/zone/zone.service';
import { CreateZoneDTO, ZoneDTO } from 'src/module/zone/dto/zone.dto';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';
import { FaceService } from 'src/module/face/face.service';
import { RoleService } from 'src/module/role/role.service';


@ApiUseTags('cms/zones')
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard(), RolesGuard)
@Controller('cms/zones')
export class CMSZoneController {
  constructor(
    @Inject(ZoneService) private zoneService: ZoneService,
    @Inject(FaceService) private faceService: FaceService,
    @Inject(RoleService) private roleService: RoleService,
  ) { }

  @ApiOkResponse({
    description: '区域列表',
    type: CreateZoneDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取区域列表', description: '获取区域列表' })
  zoneList(@Query() pagination: Pagination) {
    return this.zoneService.findAll(pagination);
  }

  @Get('/:id')
  @ApiOkResponse({
    description: '获取区域成功',
  })
  @ApiCreatedResponse({ description: '获取区域' })
  @ApiOperation({ title: '根据id获取区域信息', description: '根据id获取区域信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: IZone = await this.zoneService.findTreeById(id);
    return { statusCode: 200, msg: '获取区域成功', data };
  }

  @Get('/:id/roles')
  @ApiOkResponse({
    description: '获取区域成功',
  })
  @ApiCreatedResponse({ description: '获取区域' })
  @ApiOperation({ title: '根据id获取区域信息', description: '根据id获取区域信息' })
  async getRoleByZone(
    @Query() pagination: Pagination,
    @Param('id', new MongodIdPipe()) id: string,
  ) {
    return await this.roleService.findByZone(pagination, id);
  }

  @Post('')
  @ApiOkResponse({
    description: '添加区域成功',
  })
  @ApiOperation({ title: '添加区域', description: '添加区域' })
  async create(@Body() creatZoneDTO: CreateZoneDTO) {
    await this.zoneService.create(creatZoneDTO);
    return { statusCode: 200, msg: '添加区域成功' };
  }

  @Delete('/:id')
  @ApiOkResponse({
    description: '删除区域成功',
  })
  @ApiOperation({ title: '删除区域', description: '删除区域' })
  async delete(@Param('id', new MongodIdPipe()) id: string) {
    await this.zoneService.deleteById(id);
    return { statusCode: 200, msg: '删除区域成功' };
  }

  @Post('/:id/subZones')
  @ApiOkResponse({
    description: '添加区域成功',
  })
  @ApiOperation({ title: '添加区域', description: '添加区域' })
  async createSubZone(
    @Body() zone: CreateZoneDTO,
    @Param('id', new MongodIdPipe()) id: string
  ) {
    const data = await this.zoneService.createSubZone(zone, id);
    return { statusCode: 200, msg: '添加区域成功', data };
  }

  @ApiOkResponse({
    description: '区域人脸名单',
    type: CreateZoneDTO,
    isArray: true,
  })
  @Get('/:id/face')
  @ApiOperation({ title: '获取区域列表', description: '获取区域列表' })
  async ZoneFace(
    @Query() pagination: Pagination,
    @Param('id', new MongodIdPipe()) id: string
  ) {
    return this.faceService.findByZone(pagination, id);
  }


}