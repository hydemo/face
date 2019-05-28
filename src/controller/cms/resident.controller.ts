import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request } from '@nestjs/common';
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
import { ResidentService } from 'src/module/resident/resident.service';
import { CreateResidentDTO, ResidentDTO } from 'src/module/resident/dto/resident.dto';
import { IResident } from 'src/module/resident/interfaces/resident.interfaces';
import { Put } from '_@nestjs_common@5.7.4@@nestjs/common';


@ApiUseTags('cms/residents')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('cms/residents')
export class CMSResidentController {
  constructor(
    @Inject(ResidentService) private residentService: ResidentService,
  ) { }

  // @ApiOkResponse({
  //   description: '审核列表',
  //   type: CreateResidentDTO,
  //   isArray: true,
  // })
  // @Get('/')
  // @ApiOperation({ title: '获取区域列表', description: '获取区域列表' })
  // residentList(@Query() pagination: Pagination) {
  //   return this.residentService.findAll(pagination);
  // }

  @ApiOkResponse({
    description: '业主申请列表',
    type: ResidentDTO,
    isArray: true,
  })
  @Get('/owner-applications')
  @ApiOperation({ title: '业主申请列表', description: '业主申请列表' })
  async getOwnerApplication(@Query() pagination: Pagination) {
    return this.residentService.getOwnerApplications(pagination, { type: 'owner', checkResult: 1, isDelete: false });
  }

  @Put('/:id/agree')
  @ApiOkResponse({
    description: '同意业主申请',
  })
  @ApiOperation({ title: '同意业主申请', description: '同意业主申请' })
  async agreeOwnerApplication(
    @Param('id', new MongodIdPipe()) id: string
  ) {
    await this.residentService.agreeOwner(id);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Put('/:id/reject')
  @ApiOkResponse({
    description: '同意业主申请',
  })
  @ApiOperation({ title: '同意业主申请', description: '同意业主申请' })
  async rejectOwnerApplication(
    @Param('id', new MongodIdPipe()) id: string
  ) {
    await this.residentService.rejectOwner(id);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Post('/family')
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

  @Get('/:id')
  @ApiOkResponse({
    description: '获取区域成功',
  })
  @ApiCreatedResponse({ description: '获取区域' })
  @ApiOperation({ title: '根据id获取区域信息', description: '根据id获取区域信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: IResident = await this.residentService.findById(id);
    return { statusCode: 200, msg: '获取区域成功', data };
  }

}