import { 
  Controller, 
  All, 
  Req, 
  Res, 
  Param, 
  UseGuards, 
  Get,
  Headers 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('proxy')
@UseGuards(ThrottlerGuard) // Rate limiting
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * GET /api/proxy/health
   * Verifica la salud de todos los microservicios
   */
  @Get('health')
  async checkHealth() {
    const services = await this.proxyService.checkServicesHealth();
    return {
      gateway: {
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
      services,
    };
  }

  /**
   * GET /api/proxy/services
   * Lista los servicios disponibles
   */
  @Get('services')
  getServices() {
    return {
      available_services: this.proxyService.getAvailableServices(),
      gateway_version: '1.0.0',
    };
  }

  /**
   * Proxy para rutas de autenticación (SIN autenticación para login/register)
   * POST /api/proxy/auth/login
   * POST /api/proxy/auth/register
   * POST /api/proxy/auth/refresh
   */
  @All('auth/*')
  async proxyAuth(
    @Req() req: Request,
    @Res() res: Response
  ) {
    const path = req.url.replace('/api/proxy/auth', '/auth');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'auth',
        path,
        req.method,
        req.body,
        { 'Content-Type': 'application/json' },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el servicio de usuarios (requiere autenticación)
   * POST/GET/PUT/DELETE /api/proxy/users/*
   */
  @All('users/*')
  @UseGuards(JwtAuthGuard)
  async proxyUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/users', '/users');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'auth',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>,
        (req as any).user
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el servicio de logs (requiere autenticación)
   * GET /api/proxy/logs/*
   */
  @All('logs/*')
  @UseGuards(JwtAuthGuard)
  async proxyLogs(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/logs', '/logs');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'auth',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el servicio de upload (requiere autenticación)
   * POST /api/proxy/upload/*
   */
  @All('upload/*')
  @UseGuards(JwtAuthGuard)
  async proxyUpload(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/upload', '/upload');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'auth',
        path,
        req.method,
        req.body,
        { 
          Authorization: authHeader,
          'Content-Type': req.get('Content-Type') || 'application/json',
        },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el futuro servicio de booking (requiere autenticación)
   * ALL /api/proxy/booking/*
   */
  @All('booking/*')
  @UseGuards(JwtAuthGuard)
  async proxyBooking(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/booking', '');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'booking',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>,
        (req as any).user
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Endpoints sin autenticación para Booking Service - Copia
   * GET /api/proxy/booking-copia/test/health
   */
  @Get('booking-copia/test/health')
  async proxyBookingCopiaHealth(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.proxyService.forwardRequest(
        'booking-copia',
        '/test/health',
        'GET',
        {},
        { 'Content-Type': 'application/json' },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Endpoint de prueba Gateway sin autenticación para Booking Service - Copia
   * GET /api/proxy/booking-copia/test/gateway-test
   */
  @Get('booking-copia/test/gateway-test')
  async proxyBookingCopiaGatewayTest(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.proxyService.forwardRequest(
        'booking-copia',
        '/test/gateway-test',
        'GET',
        {},
        { 
          'Content-Type': 'application/json',
          'X-User-Id': 'gateway-test',
          'X-User-Name': 'Gateway Test User',
          'X-User-Role': 'test',
          'X-User-Email': 'gateway-test@citylights.com'
        },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Endpoint específico para descarga de facturas desde booking-service
   * GET /api/proxy/booking-copia/factura/:id/descargar
   * IMPORTANTE: Debe estar ANTES del @All para que no sea interceptado
   */
  @Get('booking-copia/factura/:id/descargar')
  @UseGuards(JwtAuthGuard)
  async descargarFactura(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    try {
      console.log('🌐 🌐 🌐 GATEWAY: Descargando factura ID:', id);
      console.log('🔑 GATEWAY: Authorization header presente:', !!authHeader);
      console.log('👤 GATEWAY: Usuario:', (req as any).user?.email || 'No disponible');
      console.log('🌐 GATEWAY: Host de la petición:', req.get('host'));
      
      const result = await this.proxyService.forwardFileRequest(
        'booking-copia',
        `/api/factura/${id}/descargar`,
        'GET',
        {},
        { Authorization: authHeader },
        {},
        (req as any).user
      );
      
      // Para archivos, reenviar directamente la respuesta
      if (result.headers) {
        // Solo copiar headers relevantes para archivos
        const allowedHeaders = ['content-type', 'content-disposition', 'content-length'];
        Object.keys(result.headers).forEach(key => {
          if (allowedHeaders.includes(key.toLowerCase())) {
            res.setHeader(key, result.headers[key]);
          }
        });
      }
      
      // Asegurar que es un Buffer para archivos PDF
      if (Buffer.isBuffer(result.data)) {
        res.end(result.data);
      } else {
        res.end(Buffer.from(result.data));
      }
    } catch (error) {
      console.error('❌ Gateway: Error descargando factura:', error);
      res.status(error.getStatus?.() || 500).json({
        message: 'Error al descargar la factura',
        error: error.message
      });
    }
  }

  /**
   * Proxy para el Booking Service - Copia (puerto 3004) - REQUIERE AUTENTICACIÓN
   * ALL /api/proxy/booking-copia/*
   */
  @All('booking-copia/*')
  @UseGuards(JwtAuthGuard)
  async proxyBookingCopia(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/booking-copia', '');
    
    console.log(`🔄 [Gateway] ${req.method} ${path}`);
    console.log(`👤 [Gateway] Usuario:`, (req as any).user);
    
    try {
      const result = await this.proxyService.forwardRequest(
        'booking-copia',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>,
        (req as any).user
      );
      
      console.log(`✅ [Gateway] Respuesta exitosa para ${req.method} ${path}`);
      res.json(result);
    } catch (error) {
      console.error(`❌ [Gateway] Error en ${req.method} ${path}:`, error.message);
      console.error(`❌ [Gateway] Error completo:`, error);
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el futuro servicio de pagos (requiere autenticación)
   * ALL /api/proxy/payment/*
   */
  @All('payment/*')
  @UseGuards(JwtAuthGuard)
  async proxyPayment(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/payment', '');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'payment',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Endpoints sin autenticación para Departamento Service
   * GET /api/proxy/departamento/test/health
   */
  @Get('departamento/test/health')
  async proxyDepartamentoHealth(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.proxyService.forwardRequest(
        'departamento',
        '/test/health',
        'GET',
        {},
        { 'Content-Type': 'application/json' },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Endpoint de prueba Gateway sin autenticación para Departamento Service
   * GET /api/proxy/departamento/test/gateway-test
   */
  @Get('departamento/test/gateway-test')
  async proxyDepartamentoGatewayTest(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.proxyService.forwardRequest(
        'departamento',
        '/test/gateway-test',
        'GET',
        {},
        { 
          'Content-Type': 'application/json',
          'X-User-Id': 'gateway-test',
          'X-User-Name': 'Gateway Test User',
          'X-User-Role': 'test',
          'X-User-Email': 'gateway-test@departamento.com'
        },
        req.query as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }



  /**
   * Proxy para el Departamento Service (puerto 3010) - REQUIERE AUTENTICACIÓN
   * ALL /api/proxy/departamento/*
   */
  @All('departamento/*')
  @UseGuards(JwtAuthGuard)
  async proxyDepartamento(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/departamento', '');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'departamento',
        path,
        req.method,
        req.body,
        { Authorization: authHeader },
        req.query as Record<string, string>,
        (req as any).user
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }

  /**
   * Proxy para el Microservicio de Nómina (puerto 3003) - REQUIERE AUTENTICACIÓN
   * Solo para super_user y user_admin
   * ALL /api/proxy/nomina/*
   */
  @All('nomina/*')
  @UseGuards(JwtAuthGuard)
  async proxyNomina(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string
  ) {
    const path = req.url.replace('/api/proxy/nomina', '');
    
    try {
      // Verificar si es una solicitud de PDF
      if (path.includes('/pdf/') || path.includes('/generar-pdf')) {
        // Manejar como archivo binario
        const fileResponse = await this.proxyService.forwardFileRequest(
          'nomina',
          path,
          req.method,
          req.body,
          { Authorization: authHeader },
          req.query as Record<string, string>,
          (req as any).user
        );

        // Configurar headers de respuesta
        if (fileResponse.headers['content-type']) {
          res.setHeader('Content-Type', fileResponse.headers['content-type']);
        }
        if (fileResponse.headers['content-disposition']) {
          res.setHeader('Content-Disposition', fileResponse.headers['content-disposition']);
        }
        if (fileResponse.headers['content-length']) {
          res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }

        // Enviar el archivo
        res.send(fileResponse.data);
      } else {
        // Manejar como JSON normal
        const result = await this.proxyService.forwardRequest(
          'nomina',
          path,
          req.method,
          req.body,
          { Authorization: authHeader },
          req.query as Record<string, string>,
          (req as any).user
        );
        
        res.json(result);
      }
    } catch (error) {
      res.status(error.getStatus?.() || 500).json(error.getResponse?.() || error.message);
    }
  }
}