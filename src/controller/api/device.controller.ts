import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';

import { CreateDeviceDTO } from '../../module/device/dto/device.dto';
import { DeviceService } from '../../module/device/device.service';
import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MongodIdPipe } from '../../common/pipe/mongodId.pipe';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorator/roles.decorator';

@ApiUseTags('devices')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), RolesGuard)
@Controller('api/devices')
export class DeviceController {
  constructor(
    private deviceService: DeviceService,
  ) { }

  @ApiOkResponse({
    description: '设备列表',
    type: CreateDeviceDTO,
    isArray: true,
  })
  @Roles('3')
  @Get('/')
  @ApiOperation({ title: '获取设备列表', description: '获取设备列表' })
  deviceList(@Query() pagination: Pagination) {
    return this.deviceService.findAll(pagination);
  }

  @Roles('3')
  @Get('/:id')
  @ApiOkResponse({
    description: '获取设备成功',
  })
  @ApiCreatedResponse({ description: '获取设备' })
  @ApiOperation({ title: '根据id获取设备信息', description: '根据id获取设备信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: CreateDeviceDTO = await this.deviceService.findById(id);
    return { statusCode: 200, msg: '获取设备成功', data };
  }

  @Roles('1')
  @Post()
  @ApiOkResponse({
    description: '添加设备成功',
  })
  @ApiOperation({ title: '添加设备', description: '添加设备' })
  async create(@Body() creatDeviceDTO: CreateDeviceDTO) {
    await this.deviceService.create(creatDeviceDTO);
    return { statusCode: 200, msg: '添加设备成功' };
  }

  // @Roles('1')
  // @Put('/:id')
  // @ApiOkResponse({
  //   description: '修改设备成功',
  // })
  // @ApiOperation({ title: '修改设备', description: '修改设备' })
  // async update(@Param('id', new MongodIdPipe()) id: string, @Body() creatDeviceDTO: CreateDeviceDTO) {
  //   await this.deviceService.upda(id, creatDeviceDTO);
  //   return { statusCode: 200, msg: '修改设备成功' };
  // }

  @Roles('1')
  @Delete('/:id')
  @ApiOkResponse({
    description: '删除设备成功',
  })
  @ApiOperation({ title: '删除设备', description: '删除设备' })
  async delete(@Param('id', new MongodIdPipe()) id: string) {
    await this.deviceService.deleteById(id);
    return { statusCode: 200, msg: '删除设备成功' };
  }

  // @Roles('1')
  // @Put('/:_id/sim/:simId')
  // @ApiOkResponse({
  //   description: '绑定旧sim卡成功',
  // })
  // @ApiOperation({ title: '绑定旧sim卡', description: '绑定旧sim卡' })
  // async bindOldDevice(@Param('_id', new MongodIdPipe()) _id: string, @Param('simId', new MongodIdPipe()) simId: string) {
  //   await this.deviceService.bindOldSim(_id, simId);
  //   return { statusCode: 200, msg: '绑定旧sim卡成功' };
  // }

  // @Roles('1')
  // @Put('/:_id/unbindSim')
  // @ApiOkResponse({
  //   description: '解绑sim卡成功',
  // })
  // @ApiOperation({ title: '解绑sim卡成功', description: '解绑sim卡成功' })
  // async unbindSim(@Param('_id', new MongodIdPipe()) _id: string) {
  //   await this.deviceService.unbindSim(_id);
  //   return { statusCode: 200, msg: '解绑sim卡成功' };
  // }
}