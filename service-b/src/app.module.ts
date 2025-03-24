import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { EventEmitterModule } from "@nestjs/event-emitter";
import { RedisService } from "./redis/redis.service";

@Module({
  imports: [RedisModule, EventEmitterModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}
