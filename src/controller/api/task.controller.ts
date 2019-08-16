import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Put, Request } from '@nestjs/common';
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
import { TaskService } from 'src/module/task/task.service';
import { CreateTaskDTO } from 'src/module/task/dto/task.dto';
import { ITask } from 'src/module/task/interfaces/task.interfaces';
import { CreateDeviceDTO } from 'src/module/device/dto/device.dto';


@ApiUseTags('tasks')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('api/tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
  ) { }

  @ApiOkResponse({
    description: '任务列表',
    type: CreateTaskDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取任务列表', description: '获取任务列表' })
  taskList(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.taskService.findByUser(pagination, req.user._id);
  }

  @Put('/:id/done')
  @ApiOkResponse({
    description: '完成任务',
  })
  @ApiOperation({ title: '完成任务', description: '完成任务' })
  async completeTask(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() device: CreateDeviceDTO
  ) {
    await this.taskService.doTask(id, device);
    return { statusCode: 200, msg: '完成任务成功' };
  }

}