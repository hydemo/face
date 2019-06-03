import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { ZoneService } from 'src/module/zone/zone.service';
import { CreateZoneDTO } from 'src/module/zone/dto/zone.dto';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';
import { UserRoles } from 'src/common/decorator/roles.decorator';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';
import { CreateBlackDTO } from 'src/module/black/dto/black.dto';
import { BlackService } from 'src/module/black/black.service';


@ApiUseTags('zones')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/zones')
export class ZoneController {
  constructor(
    @Inject(ZoneService) private zoneService: ZoneService,
    @Inject(BlackService) private blackService: BlackService,
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

  @Get('/:id/qrcode')
  @UseGuards(AuthGuard(), UserRolesGuard)
  @UserRoles(1, 3)
  @ApiOkResponse({
    description: '获取访客二维码',
  })
  @ApiCreatedResponse({ description: '获取访客二维码' })
  @ApiOperation({ title: '获取访客二维码', description: '获取访客二维码' })
  async getVisitorQrcode(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    const data: string = await this.zoneService.getVisitorQrcode(req.user._id, id);
    return { statusCode: 200, data, };
  }

  @Post('/:id/black')
  @ApiOkResponse({
    description: '申请添加黑名单',
  })
  @ApiCreatedResponse({ description: '申请添加黑名单' })
  @ApiOperation({ title: '申请添加黑名单', description: '申请添加黑名单' })
  async addBlack(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() black: CreateBlackDTO,
    @Request() req: any
  ) {
    await this.blackService.addToZone(req.user._id, id, black);
    return { statusCode: 200, msg: '申请成功成功' };
  }

}