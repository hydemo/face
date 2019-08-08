import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Put, Request } from '@nestjs/common';
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
import { BlackDTO, CreateBlackDTO } from 'src/module/black/dto/black.dto';


@ApiUseTags('blacks')
@UseGuards(AuthGuard(), RolesGuard)
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/blacks')
export class BlackController {
  constructor(
    @Inject(BlackService) private blackService: BlackService,
  ) { }

  @Post('/')
  @ApiOkResponse({
    description: '添加黑名单',
  })
  @ApiCreatedResponse({ description: '添加黑名单' })
  @ApiOperation({ title: '添加黑名单', description: '添加黑名单' })
  async addBlack(
    @Body() black: CreateBlackDTO,
    @Request() req: any
  ) {
    await this.blackService.add(req.user._id, black);
    return { statusCode: 200, msg: '申请成功成功' };
  }

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
    return this.blackService.findAll(pagination, Number(checkResult));
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

}