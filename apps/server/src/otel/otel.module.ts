import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../auth/authentication.module';
import { OtelController } from './otel.controller';
import { OtelService } from './otel.service';

@Module({
  controllers: [OtelController],
  providers: [OtelService],
  imports: [ConfigModule, AuthenticationModule],
})
export class OtelModule {}
