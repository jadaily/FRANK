import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationFilter } from './validation.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ValidationFilter());

  const requestedPort = Number(process.env.PORT) || 3000;
  const portsToTry = [requestedPort, requestedPort + 1, requestedPort + 2, requestedPort + 3];

  for (const port of portsToTry) {
    try {
      await app.listen(port, '0.0.0.0');
      console.log(`Application listening on port ${port}`);
      return;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error('Unable to start application: no available port found.');
}

bootstrap();
