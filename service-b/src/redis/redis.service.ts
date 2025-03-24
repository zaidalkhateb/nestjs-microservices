import { Injectable, Logger } from '@nestjs/common';
import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { createClient } from 'redis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as console from "node:console";

@Injectable()
export class RedisService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(private eventEmitter: EventEmitter2) {}

  private readonly logger = new Logger('Redis');

  private static keyPrefix = process.env.REDIS_KEY_PREFIX;
  private static connectionAttempts = 0;
  private static maxConnectionAttempts = 6;

  private static messageHandlers: Map<string, Function> = new Map();

  private redisClient: ReturnType<typeof createClient>;
  private pubsubClient: ReturnType<typeof createClient>;

  onApplicationBootstrap(): void {
    if (!this.pubsubClient?.connected && !this.pubsubClient?.ready) {
      this.pubsubClient = createClient({
        url: process.env.REDIS_URL,
      });

      this.pubsubClient.on('ready', () => {
        this.logger.log('Redis pubsub client is ready');
      });

      this.pubsubClient.on('message', (channel, ...args) => {
        if (RedisService.messageHandlers.has(channel)) {
          RedisService.messageHandlers.get(channel)(...args);
        }
      });
    }

    if (this.redisClient?.connected || this.redisClient?.ready) return;

    const client = createClient({
      url: process.env.REDIS_URL,
    });

    this.redisClient = client;

    client.on('error', (error) => {
      this.logger.error(error);
    });

    client.on('connect', () => {
      this.logger.log('Redis client has connected successfully');
    });

    client.on('reconnecting', () => {
      RedisService.connectionAttempts++;
      if (
        RedisService.connectionAttempts >
        RedisService.maxConnectionAttempts - 1
      ) {
        this.redisClient.quit();
        this.logger.error(
          `Attempted to connect more than ${RedisService.maxConnectionAttempts} times. Disconnecting Client`,
        );
      } else {
        this.logger.log('Redis client is reconnecting...');
      }
    });

    client.on('ready', () => {
      this.logger.log('Redis client is ready');
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.redisClient?.connected) return;

    await Promise.all([this.redisClient.quit(), this.pubsubClient.quit()]);
    this.logger.log('Redis client has disconnected successfully');
  }

  async publishMessage(channel, data) {
    if (!this.redisClient?.connected) return;
    await this.redisClient.publish(channel, data);
  }

  async listenToDynamicChannels(pattern: string): Promise<any> {
    // Return a promise that resolves when a message is received or a timeout occurs
    return new Promise((resolve, reject) => {
      // Subscribe to the channel pattern
      this.pubsubClient.psubscribe(pattern, (err, count) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Set up the listener for any matching channels
      this.pubsubClient.on('pmessage', (pattern, channel, message) => {
        // Example: If the message is in JSON format, parse it
        try {
          const parsedMessage = JSON.parse(message);
          // Resolve the promise with the parsed message or any other data
          this.eventEmitter.emit('custom.event', { message: parsedMessage, channel });
        } catch (error) {
          reject(new Error(`Failed to parse message from ${channel}`));
        }
      });

    });
  }
}
