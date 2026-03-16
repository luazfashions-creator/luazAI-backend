import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Better Auth token validation will be wired in Step 4
      // For now, the guard structure is ready
      const authUrl = this.config.get<string>('auth.url');
      const response = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const session = (await response.json()) as { user: Request['user'] };
      request['user'] = session.user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractToken(request: Request): string | undefined {
    // Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    return (request.cookies as Record<string, string> | undefined)?.[
      'session_token'
    ];
  }
}
