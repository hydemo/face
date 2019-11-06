import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { ContactService } from 'src/module/contact/contact.service';
import { CreateContactDTO, CreateContactByScanDTO } from 'src/module/contact/dto/contact.dto';
import { VerifyUserDTO } from 'src/module/users/dto/users.dto';


@ApiUseTags('contacts')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('api/contacts')
export class ContactController {
  constructor(
    private contactService: ContactService,
  ) { }

  @ApiOkResponse({
    description: '联系人列表',
    type: CreateContactDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取联系人列表', description: '获取联系人列表' })
  async contactList(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return await this.contactService.list(pagination, req.user._id);
  }

  @Post('/scan')
  @ApiOkResponse({
    description: '扫码新增联系人',
  })
  @ApiOperation({ title: '扫码新增联系人', description: '扫码新增联系人' })
  async createByScan(
    @Body() key: CreateContactByScanDTO,
    @Request() req: any
  ) {
    await this.contactService.createByScan(key.key, req.user._id);
    return { statusCode: 200, msg: '添加联系人成功' };
  }

  @Post('/input')
  @ApiOkResponse({
    description: '手动新增联系人',
  })
  @ApiOperation({ title: '手动新增联系人', description: '手动新增联系人' })
  async createByInput(
    @Body() contact: VerifyUserDTO,
    @Request() req: any
  ) {
    const clientIp = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
    await this.contactService.createByInput(contact, req.user._id, clientIp);
    return { statusCode: 200, msg: '添加联系人成功' };
  }

  @Post('/:id')
  @ApiOkResponse({
    description: '修改联系人',
  })
  @ApiOperation({ title: '修改联系人', description: '修改联系人' })
  async updateContact(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() contact: VerifyUserDTO,
  ) {
    await this.contactService.updateContact(id, contact);
    return { statusCode: 200, msg: '添加联系人成功' };
  }


  @Delete('/:id')
  @ApiOkResponse({
    description: '删除联系人',
  })
  @ApiOperation({ title: '删除联系人', description: '删除联系人' })
  async delete(
    @Param('id', new MongodIdPipe()) id: string,
    @Request() req: any
  ) {
    await this.contactService.delete(id, req.user._id)
    return { statusCode: 200, msg: '删除联系人成功' };
  }
}