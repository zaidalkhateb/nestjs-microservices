import { Controller, Get, Param, Inject } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import * as console from 'node:console';
import { OnEvent } from "@nestjs/event-emitter";

@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    setTimeout(() => {
      this.listenForMessages();
    }, 1000);
  }

  private async listenForMessages() {
    try {
      const res =
        await this.redisService.listenToDynamicChannels(`double-channel-a#*`);
      if (res) {
        const id = (res.channel).split('#')[1];
        await this.redisService.publishMessage(
          `double-channel-b#${id}`,
          JSON.stringify({ double: res.message.double * 2 }),
        );
      }
    } catch (error) {
      console.error('Redis message error:', error);
    }
  }
}
