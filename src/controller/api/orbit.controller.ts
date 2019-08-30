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
import { UserService } from 'src/module/users/user.service';
import { UserRolesGuard } from 'src/common/guard/userRoles.guard';
import { UserRoles } from 'src/common/decorator/roles.decorator';

@ApiUseTags('orbits')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), UserRolesGuard)

@Controller('api/orbits')
export class OrbitController {
  constructor(
    @Inject(OrbitService) private orbitService: OrbitService,
    @Inject(UserService) private userService: UserService,
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
    return this.orbitService.myOrbits(pagination, req.user._id, 'me');
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

  @UserRoles(4)
  @ApiOkResponse({
    description: '根据身份证查询轨迹',
    isArray: true,
  })
  @Get('/cardNumber')
  @ApiOperation({ title: '根据身份证查询轨迹', description: '根据身份证查询轨迹' })
  async orbitsByCardNumber(
    @Query() pagination: Pagination,
    // @Request() req: any,
    @Query('cardNumber') cardNumber: string,
  ) {
    const user = await this.userService.findOneByCondition({ cardNumber })
    if (!user) {
      return { list: [], total: 0 }
    }
    return this.orbitService.myOrbits(pagination, user._id, 'police');
  }

  // @UserRoles(4)
  @ApiOkResponse({
    description: '根据用户id查询轨迹',
    isArray: true,
  })
  @Get('/user/:id')
  @ApiOperation({ title: '获取轨迹列表', description: '获取轨迹列表' })
  async orbitsById(
    @Query() pagination: Pagination,
    @Param('id') id: string,
  ) {
    return this.orbitService.myOrbits(pagination, id, 'police');
  }



}