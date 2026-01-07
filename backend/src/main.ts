import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Sentry initialization
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Necesario para Stripe webhooks
  });

  // Aumentar límite de body para logos en base64
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Prefijo global para API
  app.setGlobalPrefix('api');

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro de excepciones global
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS - permitir múltiples orígenes en desarrollo
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (ej. Postman, curl) o si está en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // En desarrollo, permitir todo
      }
    },
    credentials: true,
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Turnify Backend running on http://localhost:${port}/api`);
}
bootstrap();
