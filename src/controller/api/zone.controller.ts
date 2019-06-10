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
import { CreateRentDTO } from 'src/module/rent/dto/rent.dto';
import { RentService } from 'src/module/rent/rent.service';


@ApiUseTags('zones')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/zones')
export class ZoneController {
  constructor(
    @Inject(ZoneService) private zoneService: ZoneService,
    @Inject(BlackService) private blackService: BlackService,
    @Inject(RentService) private rentService: RentService,
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

  @ApiOkResponse({
    description: '待申请房屋列表',
    type: CreateZoneDTO,
    isArray: true,
  })
  @Get('/:id/no-owner')
  @ApiOperation({ title: '待申请房屋列表', description: '待申请房屋列表' })
  noOwnerZones(
    @Param('id', new MongodIdPipe()) id: string,
    @Query() pagination: Pagination,
  ) {
    return this.zoneService.noOwnerZones(pagination, id);
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

  @Post('/:id/blacks')
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

  @Get('/:id/blacks')
  @ApiOkResponse({
    description: '小区黑名单列表',
  })
  @ApiCreatedResponse({ description: '小区黑名单列表' })
  @ApiOperation({ title: '小区黑名单列表', description: '小区黑名单列表' })
  async blacks(
    @Query() pagination: Pagination,
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any
  ) {
    return await this.blackService.findByZone(pagination, id, req.user._id);
  }

  @Get('/:id/blacks/tail')
  @UserRoles(1)
  @ApiOperation({ title: '尾部补全', description: '尾部补全' })
  async getTail(
    @Query('skip') skip: number,
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    const data = await this.blackService.getTail(skip, id, req.user._id);
    return { statusCode: 200, data };

  }

  @Get('/:id/rents')
  @ApiOkResponse({
    description: '房屋出租',
  })
  @ApiCreatedResponse({ description: '房屋出租' })
  @ApiOperation({ title: '房屋出租', description: '房屋出租' })
  async myRents(
    @Param('id', new MongodIdPipe()) id: string,
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return await this.rentService.findMyRent(pagination, req.user._id, id);
  }

  @Post('/:id/rents')
  @ApiOkResponse({
    description: '房屋出租',
  })
  @ApiCreatedResponse({ description: '房屋出租' })
  @ApiOperation({ title: '房屋出租', description: '房屋出租' })
  async rent(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() rent: CreateRentDTO,
    @Request() req: any
  ) {
    const address: IZone = await this.zoneService.findById(id);
    await this.rentService.rent(req.user._id, address, rent);
    return { statusCode: 200, msg: '房屋出租成功' };
  }

  @Delete('/:id/rents')
  @ApiOkResponse({
    description: '房屋回收',
  })
  @ApiCreatedResponse({ description: '房屋回收' })
  @ApiOperation({ title: '房屋回收', description: '房屋回收' })
  async rentRecyle(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any
  ) {
    const address: IZone = await this.zoneService.findById(id);
    await this.rentService.recyle(req.user._id, address);
    return { statusCode: 200, msg: '房屋回收成功' };
  }
}