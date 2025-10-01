import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ProxyService {
  private readonly services: Record<string, string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Mapeo de servicios y sus URLs
    this.services = {
      auth: this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001',
      booking: this.configService.get<string>('BOOKING_SERVICE_URL') || 'http://localhost:3002',
      'booking-copia': this.configService.get<string>('BOOKING_COPIA_SERVICE_URL') || 'http://localhost:3004',
      departamento: this.configService.get<string>('DEPARTAMENTO_SERVICE_URL') || 'http://localhost:3011', // Cambiado a departamento-booking NestJS
      payment: this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3003',
      nomina: this.configService.get<string>('NOMINA_SERVICE_URL') || 'http://localhost:3005',
    };
  }

  /**
   * Enruta una petición al microservicio correspondiente
   */
  async forwardRequest(
    serviceName: string,
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
    query?: Record<string, string>,
    user?: any
  ): Promise<any> {
    const serviceUrl = this.services[serviceName];
    
    if (!serviceUrl) {
      throw new BadRequestException(`Servicio '${serviceName}' no encontrado`);
    }

    try {
      // Construir headers con información del usuario
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Agregar headers de usuario si están disponibles
      if (user) {
        // Convertir el id (sub) a string para compatibilidad con otros microservicios
        requestHeaders['X-User-Id'] = String(user.sub || user.id);
        requestHeaders['X-User-Name'] = user.name || user.firstName || user.username || '';
        requestHeaders['X-User-Role'] = user.role || 'user';
        requestHeaders['X-User-Email'] = user.email || '';
      }

      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url: `${serviceUrl}/api${path}`,
        headers: requestHeaders,
        timeout: 10000, // 10 segundos
      };

      // Agregar query parameters si existen
      if (query && Object.keys(query).length > 0) {
        config.params = query;
      }

      // Agregar body para métodos que lo requieren
      if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = body;
      }

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;

    } catch (error) {
      // Manejo de errores del microservicio
      if (error.response) {
        // El microservicio respondió con un error
        throw new BadRequestException({
          message: error.response.data?.message || 'Error en el microservicio',
          statusCode: error.response.status,
          service: serviceName,
        });
      } else if (error.code === 'ECONNREFUSED') {
        // El microservicio no está disponible
        throw new ServiceUnavailableException(`Servicio '${serviceName}' no disponible`);
      } else {
        // Otro tipo de error
        throw new BadRequestException(`Error de comunicación con ${serviceName}`);
      }
    }
  }

  /**
   * Verifica la salud de todos los microservicios
   */
  async checkServicesHealth(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Mapeo de endpoints de salud específicos para cada servicio
    const healthEndpoints: Record<string, string> = {
      auth: '/api/health',
      booking: '/api/health',
      'booking-copia': '/api/test/health', // Endpoint específico para booking-copia
      departamento: '/api/departamentos', // Endpoint del departamento-booking NestJS
      payment: '/api/health',
    };

    for (const [serviceName, serviceUrl] of Object.entries(this.services)) {
      try {
        const healthEndpoint = healthEndpoints[serviceName] || '/api/health';
        const response = await firstValueFrom(
          this.httpService.get(`${serviceUrl}${healthEndpoint}`, { timeout: 5000 })
        );
        results[serviceName] = {
          status: 'UP',
          url: serviceUrl,
          response: response.data,
        };
      } catch (error) {
        results[serviceName] = {
          status: 'DOWN',
          url: serviceUrl,
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Enruta peticiones de archivos (como descargas de PDF) al microservicio correspondiente
   */
  async forwardFileRequest(
    serviceName: string,
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
    query?: Record<string, string>,
    user?: any
  ): Promise<any> {
    const serviceUrl = this.services[serviceName];
    
    if (!serviceUrl) {
      throw new BadRequestException(`Servicio '${serviceName}' no encontrado`);
    }

    try {
      console.log('🌐 ProxyService: Reenviando petición de archivo');
      console.log('🎯 Servicio:', serviceName);
      console.log('📍 Path recibido:', path);
      console.log('🔧 Método:', method);
      console.log('👤 Usuario:', user?.email || 'No disponible');

      // Configurar la petición
      // Si el path ya incluye /api/, no lo agregamos de nuevo
      const finalUrl = path.startsWith('/api/') 
        ? `${serviceUrl}${path}` 
        : `${serviceUrl}/api${path}`;
      
      console.log('🔗 URL final construida:', finalUrl);

      // Construir headers con información del usuario
      const requestHeaders = {
        ...headers,
      };

      // Agregar headers de usuario si están disponibles
      if (user) {
        // Convertir el id (sub) a string para compatibilidad con otros microservicios
        requestHeaders['X-User-Id'] = String(user.sub || user.id);
        requestHeaders['X-User-Email'] = user.email;
        requestHeaders['X-User-Name'] = user.name || user.firstName || user.username || '';
        requestHeaders['X-User-Role'] = user.role || 'user';
      }

      console.log('📋 Headers enviados:', Object.keys(requestHeaders));
      
      const config: AxiosRequestConfig = {
        method: method as any,
        url: finalUrl,
        headers: requestHeaders,
        responseType: 'arraybuffer', // Para archivos
        params: query,
        timeout: 30000, // 30 segundos para descargas
      };

      // Agregar body para métodos que lo requieren
      if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = body;
      }

      const response = await firstValueFrom(this.httpService.request(config));
      
      console.log('✅ ProxyService: Archivo recibido exitosamente');
      console.log('📊 Tamaño:', response.data?.length || 0, 'bytes');
      console.log('📋 Content-Type:', response.headers['content-type']);
      console.log('🔍 Tipo de datos:', typeof response.data);
      console.log('🔍 Es Buffer:', Buffer.isBuffer(response.data));

      // Asegurar que los datos son un Buffer para archivos
      const fileData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);

      // Debug: mostrar headers que se van a reenviar
      console.log('🔍 Headers del microservicio:', response.headers);
      console.log('🔍 Content-Disposition:', response.headers['content-disposition']);

      return {
        data: fileData,
        headers: response.headers
      };

    } catch (error) {
      console.error('❌ ProxyService: Error en petición de archivo:', error.message);
      
      // Construir la URL de la misma forma que arriba para el log
      const errorUrl = path.startsWith('/api/') 
        ? `${serviceUrl}${path}` 
        : `${serviceUrl}/api${path}`;
      console.error('🔗 URL intentada:', errorUrl);
      
      // Manejo de errores del microservicio
      if (error.response) {
        // El microservicio respondió con un error
        throw new BadRequestException({
          message: error.response.data?.message || 'Error en el microservicio',
          statusCode: error.response.status,
          service: serviceName,
        });
      } else if (error.code === 'ECONNREFUSED') {
        // El microservicio no está disponible
        throw new ServiceUnavailableException(`Servicio '${serviceName}' no disponible`);
      } else {
        // Otro tipo de error
        throw new BadRequestException(`Error de comunicación con ${serviceName}: ${error.message}`);
      }
    }
  }

  /**
   * Obtiene la lista de servicios disponibles
   */
  getAvailableServices(): Record<string, string> {
    return { ...this.services };
  }
}