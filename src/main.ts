import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const frontendUrl = config.get<string>('app.frontendUrl', 'http://localhost:3001');

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready', 'metrics'] });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Body size limit
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LuazAI API')
    .setDescription('Autonomous Brand Operating System — SEO Platform MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`🚀 LuazAI API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
