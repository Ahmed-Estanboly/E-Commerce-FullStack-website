import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const configuredOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([
    ...configuredOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]));
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalViteOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      const isConfiguredOrigin = allowedOrigins.includes(origin);
      const isNgrokOrigin = /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/.test(origin);
      const allowed = isLocalViteOrigin || isConfiguredOrigin || isNgrokOrigin;
      callback(allowed ? null : new Error('Origin not allowed by CORS'), allowed);
    },
    credentials: true,
  });
  app.setGlobalPrefix("api/v1")
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
