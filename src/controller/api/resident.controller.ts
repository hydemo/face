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


@ApiUseTags('residents')
@UseGuards(AuthGuard())
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/residents')
export class ResidentController {
  constructor(
    @Inject(ResidentService) private residentService: ResidentService,
  ) { }

  @ApiOkResponse({
    description: '业主申请列表',
    isArray: true,
  })
  @Get('/applications/owner')
  @ApiOperation({ title: '业主申请列表', description: '业主申请列表' })
  ownerApplications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.getApplications(pagination, req.user._id, 'owner');
  }

  @ApiOkResponse({
    description: '常住人申请列表',
    isArray: true,
  })
  @Get('/applications/family')
  @ApiOperation({ title: '常住人申请列表', description: '常住人申请列表' })
  familyApplications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.getApplications(pagination, req.user._id, 'family');
  }

  @ApiOkResponse({
    description: '访客申请列表',
    isArray: true,
  })
  @Get('/applications/visitor')
  @ApiOperation({ title: '访客申请列表', description: '访客申请列表' })
  visitorApplications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.getApplications(pagination, req.user._id, 'visitor');
  }

  @Post('/owner')
  @ApiOkResponse({
    description: '申请业主',
  })
  @ApiOperation({ title: '申请业主', description: '申请业主' })
  async ownerApplication(
    @Body() resident: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.ownerApplication(resident, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Delete('/:id')
  @ApiOkResponse({
    description: '删除常住人/访客',
  })
  @ApiOperation({ title: '删除常住人/访客', description: '删除常住人/访客' })
  async deleteResident(
    @Param('id', new MongodIdPipe()) id: string,
  ) {
    await this.residentService.deleteById(id);
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
  ) {
    await this.residentService.updateFamilyById(id, update);
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
  ) {
    await this.residentService.updateVisitorById(id, update);
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
    await this.residentService.addFamilyByOwner(resident, req.user._id, clientIp);
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
    description: '添加访客',
  })
  @ApiOperation({ title: '添加访客', description: '添加访客' })
  async addVisitorByScan(
    @Body() visitor: CreateVisitorByOwnerDTO,
    @Request() req: any
  ) {
    await this.residentService.addVisitorByScan(visitor, req.user._id);
    return { statusCode: 200, msg: '添加访客成功' };
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
    await this.residentService.familyApplication(resident, req.user);
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
    await this.residentService.visitorApplication(visitor, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Post('/applications/visitor/scan')
  @ApiOkResponse({
    description: '扫码访问',
  })
  @ApiOperation({ title: '扫码访问', description: '扫码访问' })
  async scanToVisitor(
    @Body() visitor: CreateVisitorByScanDTO,
    @Request() req: any
  ) {
    await this.residentService.scanToVisitor(visitor, req.user._id);
    return { statusCode: 200, msg: '扫码访问' };
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

  @Get('/applications')
  @ApiOperation({ title: '获取申请列表', description: '获取申请列表' })
  applications(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.residentService.myApplications(pagination, req.user._id);
  }
}