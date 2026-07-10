import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.refreshSecret') ||
        'default-refresh-secret',
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
