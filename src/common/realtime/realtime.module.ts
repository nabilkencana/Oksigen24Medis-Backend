import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeBroadcastInterceptor } from './realtime-broadcast.interceptor';

@Global()
@Module({
  providers: [
    RealtimeGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: RealtimeBroadcastInterceptor,
    },
  ],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
