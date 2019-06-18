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
import { MediaService } from 'src/module/media/media.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { MediaDTO } from 'src/module/media/dto/media.dto';

@ApiUseTags('cms/media')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard())
@Controller('cms/media')
export class CMSMediaController {
  constructor(
    @Inject(MediaService) private mediaService: MediaService,
  ) { }

  @ApiOkResponse({
    description: '广告机列表',
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取广告机列表', description: '获取广告机列表' })
  myMedias(
    @Query() pagination: Pagination,
  ) {
    return this.mediaService.findAll(pagination);
  }

  @ApiOkResponse({
    description: '新增广告机',
  })
  @Post('/')
  @ApiOperation({ title: '新增广告机', description: '新增广告机' })
  async createMedia(
    @Body() media: MediaDTO,
  ) {
    await this.mediaService.create(media);
    return { statusCode: 200, msg: '新增成功' };
  }
}