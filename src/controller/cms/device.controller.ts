import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Put } from '@nestjs/common';
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


@ApiUseTags('cms/devices')
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

  @Put('/:_id/media/:mediaId')
  @ApiOkResponse({
    description: '绑定广告机成功',
  })
  @ApiOperation({ title: '绑定广告机', description: '绑定广告机' })
  async bindOldDevice(@Param('_id', new MongodIdPipe()) _id: string, @Param('mediaId', new MongodIdPipe()) mediaId: string) {
    await this.deviceService.bindMedia(_id, mediaId);
    return { statusCode: 200, msg: '绑定广告机成功' };
  }

  @Put('/:_id/unbind')
  @ApiOkResponse({
    description: '解绑广告机成功',
  })
  @ApiOperation({ title: '解绑广告机成功', description: '解绑广告机成功' })
  async unbindMedia(@Param('_id', new MongodIdPipe()) _id: string) {
    await this.deviceService.unbindMedia(_id);
    return { statusCode: 200, msg: '解绑广告机成功' };
  }

  @Put('/:_id/disable')
  @ApiOkResponse({
    description: '禁用设备',
  })
  @ApiOperation({ title: '禁用设备', description: '禁用设备' })
  async disable(@Param('_id', new MongodIdPipe()) _id: string) {
    await this.deviceService.disable(_id);
    return { statusCode: 200, msg: '禁用设备' };
  }

  @Put('/:_id/enable')
  @ApiOkResponse({
    description: '启用设备',
  })
  @ApiOperation({ title: '启用设备', description: '启用设备' })
  async enable(@Param('_id', new MongodIdPipe()) _id: string) {
    await this.deviceService.enable(_id);
    return { statusCode: 200, msg: '启用设备' };
  }


}