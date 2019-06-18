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
import { MediaDTO, MediaLoginDTO } from 'src/module/media/dto/media.dto';

@ApiUseTags('api/media')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard())
@Controller('api/media')
export class MediaController {
  constructor(
    @Inject(MediaService) private mediaService: MediaService,
  ) { }

  @ApiOkResponse({
    description: '广告机登录',
    isArray: true,
  })
  @Post('/login')
  @ApiOperation({ title: '广告机登录', description: '广告机登录' })
  async login(
    @Body() login: MediaLoginDTO,
  ) {
    const data = await this.mediaService.login(login.username, login.password)
    return { status: 200, data }
  }


}