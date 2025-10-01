import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
@UseGuards(ThrottlerGuard) // Rate limiting en todas las rutas de auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Autentica al usuario y devuelve tokens
   */
  @Post('login')
  async login(@Body() credentials: { email: string; password: string }) {
    return this.authService.login(credentials);
  }

  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  @Post('register')
  async register(@Body() userData: any) {
    return this.authService.register(userData);
  }

  /**
   * POST /api/auth/verify-email
   * Verifica el email de un usuario
   */
  @Post('verify-email')
  async verifyEmail(@Body() { token }: { token: string }) {
    return this.authService.verifyEmail(token);
  }

  /**
   * GET /api/auth/profile
   * Obtiene el perfil del usuario autenticado
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.getProfile(token);
  }

  /**
   * POST /api/auth/refresh
   * Renueva el access token usando refresh token
   */
  @Post('refresh')
  async refreshToken(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * GET /api/auth/health
   * Endpoint de salud para el Auth Service
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'OK',
      service: 'CITYLIGHTS Gateway - Auth Module',
      timestamp: new Date().toISOString(),
    };
  }
}