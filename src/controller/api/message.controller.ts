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
import { MessageService } from 'src/module/message/message.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';

@ApiUseTags('message')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('api/message')
export class MessageController {
  constructor(
    @Inject(MessageService) private messageService: MessageService,
  ) { }

  @ApiOkResponse({
    description: '消息列表',
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取消息列表', description: '获取消息列表' })
  myMessages(
    @Query() pagination: Pagination,
    @Query('messageType') messageType: string,
    @Request() req: any,
  ) {
    return this.messageService.findAll(pagination, req.user._id, messageType);
  }


  @Get('/tail')
  @ApiOperation({ title: '尾部补全', description: '尾部补全' })
  async getTail(
    @Query('skip') skip: number,
    @Query('messageType') messageType: string,
    @Request() req: any,
  ) {
    const data = await this.messageService.getTail(skip, req.user._id, messageType);
    return { statusCode: 200, data };

  }

  @Get('/:id')
  @ApiOperation({ title: '获取消息历史列表', description: '获取消息历史列表' })
  async messageRecord(
    @Param('id', new MongodIdPipe()) id: string,
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return await this.messageService.findMessagesById(pagination, id, req.user._id);
  }

  @ApiOkResponse({
    description: '删除消息',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除消息', description: '删除消息' })
  async deleteMessage(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    await this.messageService.delete(id, req.user._id);
    return { statusCode: 200, msg: '删除成功' };
  }

}