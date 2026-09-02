import { Module } from '@nestjs/common';
import { RoutesCheckpointsService } from './routes-checkpoints.service';
import { RoutesCheckpointsController } from './routes-checkpoints.controller';

@Module({
  controllers: [RoutesCheckpointsController],
  providers: [RoutesCheckpointsService],
  exports: [RoutesCheckpointsService],
})
export class RoutesCheckpointsModule {}
