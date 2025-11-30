import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173', // Allow any origin that sends the request
    // credentials: false,
  });
    await app.listen(process.env.PORT ?? 9000);
}
void bootstrap();
