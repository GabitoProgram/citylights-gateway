import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
  }

  /**
   * Valida el token JWT enviado por el cliente
   */
  async validateToken(token: string): Promise<any> {
    try {
      console.log('🔍 [AUTH] Validando token en gateway...');
      console.log('🔍 [AUTH] Token recibido:', token.substring(0, 50) + '...');
      
      // 1. Verificar el token localmente con la misma clave secreta
      const payload = this.jwtService.verify(token);
      
      console.log('✅ [AUTH] Token válido, payload:', payload);
      
      // 2. Verificar que el token no esté en blacklist (opcional)
      // Aquí podrías consultar una base de datos o cache para verificar blacklist
      
      return payload;
    } catch (error) {
      console.error('❌ [AUTH] Error validando token:', error.message);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Redirige el login al Auth Service y devuelve el token
   */
  async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/api/auth/login`, credentials)
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Error en el servicio de autenticación');
    }
  }

  /**
   * Redirige el registro al Auth Service
   */
  async register(userData: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/api/auth/register`, userData)
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        throw new BadRequestException('El email ya está registrado');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Error en el servicio de registro');
    }
  }

  /**
   * Verificar email redirigido al Auth Service
   */
  async verifyEmail(token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/api/auth/verify-email`, { token })
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Error en la verificación de email');
    }
  }

  /**
   * Obtener perfil del usuario mediante Auth Service
   */
  async getProfile(token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Token inválido');
      }
      throw new BadRequestException('Error obteniendo perfil de usuario');
    }
  }

  /**
   * Refresh token mediante Auth Service
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/api/auth/refresh`, { refreshToken })
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Refresh token inválido');
      }
      throw new BadRequestException('Error renovando token');
    }
  }
}