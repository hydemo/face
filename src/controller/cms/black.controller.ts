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
import { BlackService } from 'src/module/black/black.service';
import { CreateBlackDTO, BlackDTO } from 'src/module/black/dto/black.dto';
import { IBlack } from 'src/module/black/interfaces/black.interfaces';
import { Put } from '_@nestjs_common@5.7.4@@nestjs/common';


@ApiUseTags('cms/blacks')
@UseGuards(AuthGuard(), RolesGuard)
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('cms/blacks')
export class CMSBlackController {
  constructor(
    @Inject(BlackService) private blackService: BlackService,
  ) { }

  // @ApiOkResponse({
  //   description: '审核列表',
  //   type: CreateBlackDTO,
  //   isArray: true,
  // })
  // @Get('/')
  // @ApiOperation({ title: '获取区域列表', description: '获取区域列表' })
  // blackList(@Query() pagination: Pagination) {
  //   return this.blackService.findAll(pagination);
  // }

  @ApiOkResponse({
    description: '黑名单申请列表',
    type: BlackDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '黑名单申请列表', description: '黑名单申请列表' })
  async getOwnerApplication(
    @Query() pagination: Pagination,
    @Query('checkResult') checkResult: number,
  ) {
    return this.blackService.findAll(pagination, checkResult);
  }

  @Put('/:id/agree')
  @ApiOkResponse({
    description: '同意黑名单申请',
  })
  @ApiOperation({ title: '同意黑名单申请', description: '同意黑名单申请' })
  async agreeOwnerApplication(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.blackService.agree(id, req.user._id);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Put('/:id/reject')
  @ApiOkResponse({
    description: '拒绝黑名单申请',
  })
  @ApiOperation({ title: '拒绝黑名单申请', description: '拒绝黑名单申请' })
  async rejectOwnerApplication(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.blackService.reject(id, req.user._id);
    return { statusCode: 200, msg: '拒绝成功' };
  }

  @Get('/:id')
  @ApiOkResponse({
    description: '获取区域成功',
  })
  @ApiCreatedResponse({ description: '获取区域' })
  @ApiOperation({ title: '根据id获取区域信息', description: '根据id获取区域信息' })
  async findById(@Param('id', new MongodIdPipe()) id: string) {
    const data: IBlack | null = await this.blackService.findById(id);
    return { statusCode: 200, msg: '获取区域成功', data };
  }

}