import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request, Put } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { SchoolService } from 'src/module/school/school.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { HeadTeacherApplicationDTO, StudentApplicationDTO, VisitorApplicationDTO, UpdateStudentDTO, BindParent, CreateVisitorDTO } from 'src/module/school/dto/school.dto';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';


@ApiUseTags('schools')
@UseGuards(AuthGuard(), UserRolesGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/schools')
export class SchoolController {
  constructor(
    @Inject(SchoolService) private schoolService: SchoolService,
  ) { }

  /**
   * 申请相关接口
   */
  @Post('/headTeacher')
  @ApiOkResponse({
    description: '申请班主任',
  })
  @ApiOperation({ title: '申请班主任', description: '申请班主任' })
  async ownerApplication(
    @Body() headTeacher: HeadTeacherApplicationDTO,
    @Request() req: any
  ) {
    await this.schoolService.ownerApply(headTeacher, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  // @Roles('4')
  // @Get('/address/:id')
  // @ApiOperation({ title: '根据地址获取住户信息', description: '根据地址获取住户信息' })
  // getSchoolsByAddress(
  //   @Param('id') id: string,
  //   @Request() req: any
  // ) {
  //   return this.schoolService.getSchoolByAddress(id);
  // }


  // @Roles('4')
  // @Get('/cardNumber')
  // @ApiOperation({ title: '根据身份证获取住户信息', description: '根据身份证获取住户信息' })
  // getSchoolsByCardNumber(
  //   @Query('cardNumber') cardNumber: string,
  //   @Request() req: any
  // ) {
  //   return this.schoolService.getSchoolByCardNumber(cardNumber);
  // }

  @Post('/applications/student')
  @ApiOkResponse({
    description: '申请学生',
  })
  @ApiOperation({ title: '申请学生', description: '申请学生' })
  async studentApplication(
    @Body() student: StudentApplicationDTO,
    @Request() req: any
  ) {
    await this.schoolService.studentApply(student, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Post('/applications/visitor')
  @ApiOkResponse({
    description: '申请访客',
  })
  @ApiOperation({ title: '申请访客', description: '申请访客' })
  async visitorApplication(
    @Body() visitor: VisitorApplicationDTO,
    @Request() req: any
  ) {
    await this.schoolService.visitorApply(visitor, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @ApiOkResponse({
    description: '我的申请列表',
    isArray: true,
  })
  @Get('/applications')
  @ApiOperation({ title: '我的申请列表', description: '我的申请列表' })
  headTeacherApplications(
    @Query() pagination: Pagination,
    @Query('applicationType') applicationType: string,
    @Request() req: any
  ) {
    return this.schoolService.getApplications(pagination, req.user._id, applicationType);
  }

  // @ApiOkResponse({
  //   description: '我的学生申请列表',
  //   isArray: true,
  // })
  // @Get('/applications/student')
  // @ApiOperation({ title: '我的学生申请列表', description: '我的学生申请列表' })
  // studentApplications(
  //   @Query() pagination: Pagination,
  //   @Request() req: any
  // ) {
  //   return this.schoolService.getApplications(pagination, req.user._id, 'student');
  // }

  // @ApiOkResponse({
  //   description: '我的访客申请列表',
  //   isArray: true,
  // })
  // @Get('/applications/visitor')
  // @ApiOperation({ title: '我的访客申请列表', description: '我的访客申请列表' })
  // visitorApplications(
  //   @Query() pagination: Pagination,
  //   @Request() req: any
  // ) {
  //   return this.schoolService.getApplications(pagination, req.user._id, 'visitor');
  // }


  @Roles('5')
  @ApiOkResponse({
    description: '班主任审核列表',
    isArray: true,
  })
  @Get('/applications/ownerReview')
  @ApiOperation({ title: '班主任审核列表', description: '班主任审核列表' })
  ownerReviews(
    @Query() pagination: Pagination,
    @Query('checkResult') checkResult: number,
    @Request() req: any
  ) {
    return this.schoolService.ownerApplications(pagination, req.user._id, Number(checkResult));
  }


  @Post('/visitor/scan')
  @ApiOkResponse({
    description: '扫码添加访客',
  })
  @ApiOperation({ title: '扫码添加访客', description: '扫码添加访客' })
  async addVisitorByScan(
    @Body() visitor: CreateVisitorDTO,
    @Request() req: any
  ) {
    await this.schoolService.addVisitorByScan(visitor, req.user._id);
    return { statusCode: 200, msg: '添加访客成功' };
  }

  @Roles('3')
  @Post('/visitor/guard')
  @ApiOkResponse({
    description: '保安添加访客',
  })
  @ApiOperation({ title: '扫码添加访客', description: '扫码添加访客' })
  async addVisitorByGuard(
    @Body() visitor: CreateVisitorDTO,
    @Request() req: any
  ) {
    await this.schoolService.addVisitorByGuard(visitor, req.user._id);
    return { statusCode: 200, msg: '添加访客成功' };
  }

  @Delete('/:id')
  @ApiOkResponse({
    description: '删除学生/访客',
  })
  @ApiOperation({ title: '删除学生/访客', description: '删除学生/访客' })
  async deleteSchool(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.schoolService.deleteById(id, req.user);
    return { statusCode: 200, msg: '删除成功' };
  }

  @Put('/:id/student')
  @ApiOkResponse({
    description: '修改学生',
  })
  @ApiOperation({ title: '修改学生', description: '修改学生' })
  async updateFamily(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() update: UpdateStudentDTO,
    @Request() req: any,
  ) {
    await this.schoolService.updateStudentById(id, update, req.user._id);
    return { statusCode: 200, msg: '修改成功' };
  }

  @Put('/:id/parent')
  @ApiOkResponse({
    description: '添加家长',
  })
  @ApiOperation({ title: '添加家长', description: '添加家长' })
  async bindParent(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() bind: BindParent,
    @Request() req: any,
  ) {
    await this.schoolService.bindParent(id, req.user._id, bind.key, bind.parentType);
    return { statusCode: 200, msg: '修改成功' };
  }

  @Delete('/:id/parent/:parentId')
  @ApiOkResponse({
    description: '删除家长',
  })
  @ApiOperation({ title: '删除家长', description: '删除家长' })
  async deleteParent(
    @Param('id', new MongodIdPipe()) id: string,
    @Param('parentId', new MongodIdPipe()) parentId: string,
  ) {
    await this.schoolService.deleteParent(id, parentId);
    return { statusCode: 200, msg: '删除成功' };
  }

  @Get('/students')
  @ApiOkResponse({
    description: '学生列表',
  })
  @ApiOperation({ title: '学生列表', description: '学生列表' })
  async student(
    @Request() req: any
  ) {
    const data = await this.schoolService.students(req.user._id);
    return { statusCode: 200, data };
  }


  @Get('/children')
  @ApiOkResponse({
    description: '小孩列表',
  })
  @ApiOperation({ title: '小孩列表', description: '小孩列表' })
  async children(
    @Request() req: any
  ) {
    const data = await this.schoolService.children(req.user._id);
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
    const data = await this.schoolService.visitors(req.user._id);
    return { statusCode: 200, data };
  }

  @Get('/link')
  @ApiOkResponse({
    description: '生成链接',
  })
  @ApiOperation({ title: '生成链接', description: '生成链接' })
  async getVisitorLink(
    @Query('address', new MongodIdPipe()) address: string,
    @Query('type') type: string,
    @Request() req: any
  ) {
    const data = await this.schoolService.getLink(address, req.user, type);
    return { statusCode: 200, data };
  }

  @Put('/applications/:id/agree-student')
  @ApiOkResponse({
    description: '接受学生申请',
  })
  @ApiOperation({ title: '接受学生申请', description: '接受学生申请' })
  async agreeFamily(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.schoolService.agreeStudent(id, req.user);
    return { statusCode: 200, msg: '接受学生申请成功' };
  }


  @Roles('5')
  @Put('/applications/:id/agree-owner')
  @ApiOkResponse({
    description: '接受班主任申请',
  })
  @ApiOperation({ title: '接受班主任申请', description: '接受班主任申请' })
  async agreeOwnerByManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.schoolService.agreeOwnerByManagement(id, req.user._id);
    return { statusCode: 200, msg: '审核成功' };
  }


  @Roles('5')
  @Put('/applications/:id/reject-owner')
  @ApiOkResponse({
    description: '拒绝班主任申请',
  })
  @ApiOperation({ title: '拒绝班主任申请', description: '拒绝班主任申请' })
  async rejectOwnerByManagement(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.schoolService.rejectOwnerByManagement(id, req.user._id);
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
  ) {
    await this.schoolService.agreeVisitor(id, req.user);
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
    await this.schoolService.rejectApplication(id, req.user);
    return { statusCode: 200, msg: '拒绝学生申请成功' };
  }

  @Get('/reviews')
  @ApiOperation({ title: '获取审核列表', description: '获取审核列表' })
  applications(
    @Query() pagination: Pagination,
    @Query('checkResult') checkResult: number,
    @Request() req: any
  ) {
    return this.schoolService.myReviews(pagination, req.user._id, Number(checkResult));
  }
}