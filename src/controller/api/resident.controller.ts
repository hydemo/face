import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request, Put } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { ResidentService } from 'src/module/resident/resident.service';
import { CreateResidentDTO, CreateFamilyDTO, AgreeVisitorDTO, AgreeFamilyDTO, CreateFamilyByScanDTO, CreateVisitorByScanDTO, UpdateFamilyDTO, CreateVisitorByOwnerDTO } from 'src/module/resident/dto/resident.dto';
import { Roles } from 'src/common/decorator/roles.decorator';


@ApiUseTags('residents')
@UseGuards(AuthGuard(), RolesGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/residents')
export class ResidentController {
  constructor(
    @Inject(ResidentService) private residentService: ResidentService,
  ) { }

  /**
   * 申请相关接口
   */
  @Post('/owner')
  @ApiOkResponse({
    description: '申请业主',
  })
  @ApiOperation({ title: '申请业主', description: '申请业主' })
  async ownerApplication(
    @Body() resident: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.ownerApply(resident, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Roles('4')
  @Get('/address/:id')
  @ApiOperation({ title: '根据地址获取住户信息', description: '根据地址获取住户信息' })
  getResidentsByAddress(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.residentService.getResidentByAddress(id);
  }


  @Roles('4')
  @Get('/cardNumber')
  @ApiOperation({ title: '根据身份证获取住户信息', description: '根据身份证获取住户信息' })
  getResidentsByCardNumber(
    @Query('cardNumber') cardNumber: string,
    @Request() req: any
  ) {
    return this.residentService.getResidentByCardNumber(cardNumber);
  }

  @Post('/applications/family')
  @ApiOkResponse({
    description: '申请常住人',
  })
  @ApiOperation({ title: '申请常住人', description: '申请常住人' })
  async familyApplication(
    @Body() resident: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.familyApply(resident, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Post('/applications/visitor')
  @ApiOkResponse({
    description: '申请访客',
  })
  @ApiOperation({ title: '申请访客', description: '申请访客' })
  async visitorApplication(
    @Body() visitor: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.visitorApply(visitor, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }


  @ApiOkResponse({
    description: '我的申请列表',
    isArray: true,
  })
  @Get('/applications/family')
  @ApiOperation({ title: '我的申请列表', description: '我的申请列表' })
  familyApplications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.getApplications(pagination, req.user._id, 'family');
  }

  @ApiOkResponse({
    description: '我的申请列表',
    isArray: true,
  })
  @Get('/applications/visitor')
  @ApiOperation({ title: '我的申请列表', description: '我的申请列表' })
  visitorApplications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.getApplications(pagination, req.user._id, 'visitor');
  }


  @Roles('1')
  @ApiOkResponse({
    description: '业主审核列表',
    isArray: true,
  })
  @Get('/applications/ownerReview')
  @ApiOperation({ title: '业主审核列表', description: '业主审核列表' })
  ownerReviews(
    @Query() pagination: Pagination,
    @Query('checkResult') checkResult: number,
    @Request() req: any
  ) {
    return this.residentService.ownerApplications(pagination, req.user._id, Number(checkResult));
  }


  @Delete('/:id')
  @ApiOkResponse({
    description: '删除常住人/访客',
  })
  @ApiOperation({ title: '删除常住人/访客', description: '删除常住人/访客' })
  async deleteResident(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.residentService.deleteById(id, req.user._id);
    return { statusCode: 200, msg: '删除成功' };
  }

  @Put('/:id/family')
  @ApiOkResponse({
    description: '修改常住人',
  })
  @ApiOperation({ title: '修改常住人', description: '修改常住人' })
  async updateFamily(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() update: UpdateFamilyDTO,
    @Request() req: any,
  ) {
    await this.residentService.updateFamilyById(id, update, req.user._id);
    return { statusCode: 200, msg: '修改成功' };
  }

  @Put('/:id/visitor')
  @ApiOkResponse({
    description: '访客时间延期',
  })
  @ApiOperation({ title: '访客时间延期', description: '访客时间延期' })
  async updateVisitor(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() update: AgreeVisitorDTO,
    @Request() req: any,
  ) {
    await this.residentService.updateVisitorById(id, update, req.user._id);
    return { statusCode: 200, msg: '修改成功' };
  }

  @Get('/families')
  @ApiOkResponse({
    description: '常住人列表',
  })
  @ApiOperation({ title: '常住人列表', description: '常住人列表' })
  async families(
    @Request() req: any
  ) {
    const data = await this.residentService.families(req.user._id);
    return { statusCode: 200, data };
  }

  @Get('/visitors')
  @ApiOkResponse({
    description: '访客列表',
  })
  @ApiOperation({ title: '访客列表', description: '访客列表' })
  async visitors(
    @Request() req: any
  ) {
    const data = await this.residentService.visitors(req.user._id);
    return { statusCode: 200, data };
  }

  @Post('/family')
  @ApiOkResponse({
    description: '添加常住人',
  })
  @ApiOperation({ title: '添加常住人', description: '添加常住人' })
  async addFamily(
    @Body() resident: CreateFamilyDTO,
    @Request() req: any
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    await this.residentService.addFamilyByInput(resident, req.user._id, clientIp);
    return { statusCode: 200, msg: '添加常住人成功' };
  }

  @Post('/family/scan')
  @ApiOkResponse({
    description: '扫码添加常住人',
  })
  @ApiOperation({ title: '扫码添加常住人', description: '扫码添加常住人' })
  async addFamilyByScan(
    @Body() resident: CreateFamilyByScanDTO,
    @Request() req: any
  ) {
    await this.residentService.addFamilyByScan(resident, req.user._id);
    return { statusCode: 200, msg: '扫码添加常住人成功' };
  }

  @Post('/visitor/scan')
  @ApiOkResponse({
    description: '扫码添加访客',
  })
  @ApiOperation({ title: '扫码添加访客', description: '扫码添加访客' })
  async addVisitorByScan(
    @Body() visitor: CreateVisitorByOwnerDTO,
    @Request() req: any
  ) {
    await this.residentService.addVisitorByScan(visitor, req.user._id);
    return { statusCode: 200, msg: '添加访客成功' };
  }

  @Get('/visitor/link')
  @ApiOkResponse({
    description: '生成访客链接',
  })
  @ApiOperation({ title: '生成访客链接', description: '生成访客链接' })
  async getVisitorLink(
    @Query('address', new MongodIdPipe()) address: string,
    @Request() req: any
  ) {
    const data = await this.residentService.getVisitorLink(address, req.user);
    return { statusCode: 200, data };
  }

  @Post('/visitor/link')
  @ApiOkResponse({
    description: '链接访问',
  })
  @ApiOperation({ title: '链接访问', description: '链接访问' })
  async AddVisitorByLink(
    @Body() key: { key: string },
    @Request() req: any
  ) {
    await this.residentService.addVisitorByLink(key.key, req.user);
    return { statusCode: 200, msg: '添加访客成功' };
  }

  @Put('/applications/:id/agree-family')
  @ApiOkResponse({
    description: '接受常住人申请',
  })
  @ApiOperation({ title: '接受常住人申请', description: '接受常住人申请' })
  async agreeFamily(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
    @Body() family: AgreeFamilyDTO,
  ) {
    await this.residentService.agreeFamily(id, req.user, family);
    return { statusCode: 200, msg: '接受常住人申请成功' };
  }


  @Roles('1')
  @Put('/applications/:id/agree-owner')
  @ApiOkResponse({
    description: '接受业主申请',
  })
  @ApiOperation({ title: '接受业主申请', description: '接受业主申请' })
  async agreeOwnerByManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.residentService.agreeOwnerByManagement(id, req.user._id);
    return { statusCode: 200, msg: '审核成功' };
  }


  @Roles('1')
  @Put('/applications/:id/reject-owner')
  @ApiOkResponse({
    description: '拒绝业主申请',
  })
  @ApiOperation({ title: '拒绝业主申请', description: '拒绝业主申请' })
  async rejectOwnerByManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.residentService.rejectOwnerByManagement(id, req.user._id);
    return { statusCode: 200, msg: '拒绝成功' };
  }

  @Put('/applications/:id/agree-visitor')
  @ApiOkResponse({
    description: '接受访客申请',
  })
  @ApiOperation({ title: '接受访客申请', description: '接受访客申请' })
  async agreeVisitor(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
    @Body() visitor: AgreeVisitorDTO,
  ) {
    await this.residentService.agreeVisitor(id, req.user, visitor.expireTime);
    return { statusCode: 200, msg: '接受访客申请成功' };
  }

  @Put('/applications/:id/reject')
  @ApiOkResponse({
    description: '拒绝申请',
  })
  @ApiOperation({ title: '拒绝申请', description: '拒绝申请' })
  async rejectFamily(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any
  ) {
    await this.residentService.rejectApplication(id, req.user);
    return { statusCode: 200, msg: '拒绝常住人申请成功' };
  }

  @Get('/reviews')
  @ApiOperation({ title: '获取审核列表', description: '获取审核列表' })
  applications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.myReviews(pagination, req.user._id);
  }
}