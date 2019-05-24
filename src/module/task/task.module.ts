import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TaskService } from './task.service';
import { tasksProviders } from './task.providers';
import { DatabaseModule } from 'src/database/database.module';
import { DeviceModule } from '../device/device.module';

@Module({
  providers: [TaskService, ...tasksProviders],
  exports: [TaskService],
  imports: [
    DatabaseModule,
    DeviceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class TaskModule { }
