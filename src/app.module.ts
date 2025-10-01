import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting (máximo 50 requests por minuto por IP)
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 50,
    }]),
    
    // Cliente HTTP para comunicación con microservicios
    HttpModule.register({
      timeout: 10000, // 10 segundos timeout
      maxRedirects: 3,
    }),
    
    // Módulos del gateway
    AuthModule,
    ProxyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*'); // Aplicar logging a todas las rutas
  }
}