import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix para todas las rutas
  app.setGlobalPrefix('api');
  
  // Validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS MUY PERMISIVO para debug (SOLO para desarrollo)
  app.enableCors({
    origin: true, // Permite CUALQUIER origen
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['*'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  });
  
  console.log('🔒 CORS configurado de manera PERMISIVA para debug');

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  
  console.log('🌐 CITYLIGHTS Gateway iniciado en puerto', port);
  console.log('🔀 Enrutando hacia:');
  console.log('  📧 Auth Service:', process.env.AUTH_SERVICE_URL);
  console.log('  🏨 Booking Service:', process.env.BOOKING_SERVICE_URL);
  console.log('  💳 Payment Service:', process.env.PAYMENT_SERVICE_URL);
}

bootstrap();