import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Inject, Request } from '@nestjs/common';

import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrbitService } from 'src/module/orbit/orbit.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';

@ApiUseTags('orbits')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('api/orbits')
export class OrbitController {
  constructor(
    @Inject(OrbitService) private orbitService: OrbitService,
  ) { }

  @ApiOkResponse({
    description: '轨迹列表',
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取轨迹列表', description: '获取轨迹列表' })
  myOrbits(
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return this.orbitService.myOrbits(pagination, req.user._id);
  }

  @Get('/tail')
  @ApiOperation({ title: '尾部补全', description: '尾部补全' })
  async getTail(
    @Query('skip') skip: number,
    @Request() req: any,
  ) {
    const data = await this.orbitService.getTail(skip, req.user._id);
    return { statusCode: 200, data };

  }

  @ApiOkResponse({
    description: '删除轨迹',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除轨迹', description: '删除轨迹' })
  async deleteOrbit(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.orbitService.delete(id, req.user._id);
    return { statusCode: 200, msg: '删除成功' };

  }



}