import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DrizzleModule } from './drizzle/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoutesCheckpointsModule } from './routes-checkpoints/routes-checkpoints.module';
import { PatrolModule } from './patrol/patrol.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    AuthModule,
    UsersModule,
    RoutesCheckpointsModule,
    PatrolModule,
  ],
})
export class AppModule {}
