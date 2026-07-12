import * as dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

// Watch reload trigger: reload database configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';
import compression from 'compression';

import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

  // 1. Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'style-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net'],
        },
      },
    }),
  );

  // 2. Enable CORS (Cross-Origin Resource Sharing)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://oksigen24-medis-dashboard.vercel.app', // Dashboard Vercel (with dash)
        'https://oksigen24medis-dashboard.vercel.app',  // Dashboard Vercel (without dash)
        'https://api.oksigen24medis.com',               // API Production
        'https://dashboard.oksigen24medis.com/',        // Dashboard Production 
        'http://localhost:3000',                        // Dev Dashboard/Backend
        'http://localhost:3001',
        'http://localhost:5173',                        // Dev Vite
        'http://localhost:5174',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Compression for performance
  app.use(compression());

  // 4. Global Filters and Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Oxygen Rental Management System API')
    .setDescription(
      'Production-ready backend REST API for managing oxygen cylinder rentals, sales, purchase restocks, refills, stock movements, and financial statements.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui-standalone-preset.js',
    ],
  });

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger Documentation is available at: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
