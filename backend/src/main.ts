import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Habilitar CORS
  app.enableCors();

  // Validação Global
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

  // Setup OpenAPI Swagger na rota /api/docs
  const config = new DocumentBuilder()
    .setTitle('Patrol System API - Sistema de Ronda')
    .setDescription(
      'API RESTful para controle de rondas de segurança com suporte a sincronização offline, controle de rotas e checkpoints com QR Code.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend rodando em http://localhost:${port}`);
  console.log(`Documentação OpenAPI / Swagger disponível em http://localhost:${port}/api/docs`);
}

bootstrap();
