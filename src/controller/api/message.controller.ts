import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Inject, Request } from '@nestjs/common';

import { Pagination } from '../../common/dto/pagination.dto';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from 'src/module/message/message.service';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';

@ApiUseTags('messages')

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
    @Request() req: any,
  ) {
    return this.messageService.findAll(pagination, req.user._id);
  }

  @Get('/id')
  @ApiOperation({ title: '获取消息历史列表', description: '获取消息历史列表' })
  messageRecord(
    @Param('id', new MongodIdPipe()) id: string,
    @Query() pagination: Pagination,
    @Request() req: any,
  ) {
    return this.messageService.findMessagesById(pagination, id, req.user._id);
  }

  @ApiOkResponse({
    description: '删除消息',
  })
  @Delete('/:id')
  @ApiOperation({ title: '删除消息', description: '删除消息' })
  deleteMessage(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any,
  ) {
    return this.messageService.delete(id, req.user._id);
  }

}