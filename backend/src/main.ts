import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que el frontend Angular pueda conectarse
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://carpinteria-pablo.web.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Validación automática de datos entrantes
  app.useGlobalPipes(new ValidationPipe());

  // Configuración de Swagger (documentación automática de APIs)
  const config = new DocumentBuilder()
    .setTitle("Pablo's Carpintería — API")
    .setDescription('API REST para gestión de productos y citas de carpintería')
    .setVersion('1.0')
    .addTag('productos', 'Gestión del catálogo de muebles')
    .addTag('citas', 'Gestión de solicitudes de visita')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🪵 Pablo's Carpintería API corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/api/docs`);
}
bootstrap();