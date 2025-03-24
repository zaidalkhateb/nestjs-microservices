import { Injectable } from '@nestjs/common';
import { OnEvent } from "@nestjs/event-emitter";
import { RedisService } from "./redis/redis.service";
import * as console from "node:console";

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}

  @OnEvent('custom.event')
  handleCustomEvent(payload: any) {
    if (payload) {
      const id = (payload.channel).split('#')[1];
       this.redisService.publishMessage(
        `double-channel-b#${id}`,
        JSON.stringify({ double: payload.message.double * 2 }),
      );
    }
  }
}
