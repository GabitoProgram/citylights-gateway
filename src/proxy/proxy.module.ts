import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule, // Para acceder al AuthService
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}