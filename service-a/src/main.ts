import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('Service A is running on http://localhost:3000');
}

bootstrap();
