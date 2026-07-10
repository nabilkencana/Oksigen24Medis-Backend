import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeBroadcastInterceptor implements NestInterceptor {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const method = req?.method;

    return next.handle().pipe(
      tap(() => {
        if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          // Exclude auth login/register endpoints to avoid redundant noise
          if (
            req.url.includes('/auth/login') ||
            req.url.includes('/auth/register')
          ) {
            return;
          }
          console.log(
            `[WS-Broadcast] Broadcast triggered by ${method} ${req.url}`,
          );
          this.realtimeGateway.broadcast('db_change', {
            method,
            url: req.url,
          });
        }
      }),
    );
  }
}
