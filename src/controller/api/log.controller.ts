import { Body, Controller, Get, Param, Query, UseGuards, Put, Request } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { LogRecordService } from 'src/module/logRecord/logRecord.service';


@ApiUseTags('logs')
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard())
@Controller('api/logs')
export class LogController {
  constructor(
    private logService: LogRecordService,
  ) { }

  @ApiOkResponse({
    description: '获取用户数据',
    isArray: true,
  })
  @Get('/user')
  @ApiOperation({ title: '获取用户数据', description: '获取用户数据' })
  async userRecord(
    @Query('type') type: string,
  ) {
    const data = await this.logService.getUserRecord(type)
    return { status: 200, data };
  }

  @ApiOkResponse({
    description: '根据区间获取用户数据',
    isArray: true,
  })
  @Get('/user/between')
  @ApiOperation({ title: '根据区间获取用户数据', description: '根据区间获取用户数据' })
  async userRecordBetween(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const data = await this.logService.getUserRecordBetween(start, end)
    return { status: 200, data };
  }

  @ApiOkResponse({
    description: '获取上传数据',
    isArray: true,
  })
  @Get('/upload')
  @ApiOperation({ title: '获取上传数据', description: '获取上传数据' })
  async uploadRecord(
    @Query('type') type: string,
  ) {
    const data = await this.logService.getUploadRecord(type)
    return { status: 200, data };
  }

  @ApiOkResponse({
    description: '根据区间获取上传数据',
    isArray: true,
  })
  @Get('/upload/between')
  @ApiOperation({ title: '根据区间获取上传数据', description: '根据区间获取上传数据' })
  async uploadRecordBetween(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const data = await this.logService.getUploadRecordBetween(start, end)
    return { status: 200, data };
  }

}