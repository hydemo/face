import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { StrangerService } from 'src/module/stranger/stranger.service';
import { CreateStrangerDTO } from 'src/module/stranger/dto/stranger.dto';


@ApiUseTags('strangers')
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard(), RolesGuard)
@Controller('cms/strangers')
export class CMSStrangerController {
  constructor(
    private strangerService: StrangerService,
  ) { }

  @ApiOkResponse({
    description: '陌生人列表',
    type: CreateStrangerDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取陌生人列表', description: '获取陌生人列表' })
  strangerList(@Query() pagination: Pagination) {
    return this.strangerService.findAll(pagination);
  }

  // @Get('/:id')
  // @ApiOkResponse({
  //   description: '获取陌生人成功',
  // })
  // @ApiCreatedResponse({ description: '获取陌生人' })
  // @ApiOperation({ title: '根据id获取陌生人信息', description: '根据id获取陌生人信息' })
  // async findById(@Param('id', new MongodIdPipe()) id: string) {
  //   const data: IStranger = await this.strangerService.findById(id);
  //   return { statusCode: 200, msg: '获取陌生人成功', data };
  // }

  @Post('')
  @ApiOkResponse({
    description: '添加陌生人成功',
  })
  @ApiOperation({ title: '添加陌生人', description: '添加陌生人' })
  async create(@Body() creatStrangerDTO: CreateStrangerDTO) {
    await this.strangerService.create(creatStrangerDTO);
    return { statusCode: 200, msg: '添加陌生人成功' };
  }

  // @Delete('/:id')
  // @ApiOkResponse({
  //   description: '删除陌生人成功',
  // })
  // @ApiOperation({ title: '删除陌生人', description: '删除陌生人' })
  // async delete(@Param('id', new MongodIdPipe()) id: string) {
  //   await this.strangerService.deleteById(id);
  //   return { statusCode: 200, msg: '删除陌生人成功' };
  // }


}