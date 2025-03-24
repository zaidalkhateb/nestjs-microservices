import { Controller, Get, Param, Inject } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { randomName } from './Helper/GeneratRandomKey';
import * as console from "node:console";


@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Get('/double/:num')
  async double(@Param('num') num: number) {
    const id = randomName(8);
    await this.redisService.publishMessage(
      `double-channel-a#${id}`,
      JSON.stringify({ double: num }),
    );
    const response = await this.redisService.listenToDynamicChannels(
      `double-channel-b#${id}`,
    );

    return response.message;
  }
}
