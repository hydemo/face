import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CreateDeviceDTO } from 'src/module/device/dto/device.dto';
import { Pagination } from 'src/common/dto/pagination.dto';
import { DeviceService } from 'src/module/device/device.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';


@ApiUseTags('devices')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('cms/devices')
export class CMSDeviceController {
  constructor(
    private deviceService: DeviceService,
  ) { }

  @ApiOkResponse({
    description: '设备列表',
    type: CreateDeviceDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取设备列表', description: '获取设备列表' })
  deviceList(@Query() pagination: Pagination) {
    return this.deviceService.findAll(pagination);
  }

  @Get('/:id')
  @ApiOkResponse({
    description: '获取设备成功',
  })
  @ApiCreatedResponse({ description: '获取设备' })
  @ApiOperation({ title: '根据id获取设备信息', description: '根据id获取设备信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: IDevice = await this.deviceService.findById(id);
    return { statusCode: 200, msg: '获取设备成功', data };
  }

  @Post('/')
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