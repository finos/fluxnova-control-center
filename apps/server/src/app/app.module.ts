import compression from 'compression';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import pretty from 'pino-pretty';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DEFAULT_IDENTITY_HEADER_KEY } from '@fxn/types';
import { ProcessDefinitionController } from '../fluxnova/process-definition/process-definition.controller';
import { ProcessInstanceController } from '../fluxnova/process-instance/process-instance.controller';
import { VariableController } from '../fluxnova/variable/variable.controller';
import { JobController } from '../fluxnova/job/job.controller';
import { MigrationController } from '../fluxnova/migration/migration.controller';
import { IncidentController } from '../fluxnova/incident/incident.controller';
import { BatchController } from '../fluxnova/batch/batch.controller';
import { DecisionDefinitionController } from '../fluxnova/decision-definition/decision-definition.controller';
import { DeploymentController } from '../fluxnova/deployment/deployment.controller';
import { DecisionRequirementsDefinitionController } from '../fluxnova/decision-requirements/decision-requirements-definition.controller';
import { DecisionInstanceController } from '../fluxnova/decision-instance/decision-instance.controller';
import { ApplicationRoutesController } from '../app-routes/application-routes.controller';
import { HealthController } from '../health/health.controller';
import { UserTaskController } from '../fluxnova/task/user-task.controller';
import { HttpExceptionFilter } from '../nest/http-exception.filter';
import { StaticAssetsModule } from '../static-assets/static-assets.module';
import { AuthenticationModule } from '../auth/authentication.module';
import { AuthorizationController } from '../fluxnova/authorization/authorization.controller';
import {
  doubleCsrfProtection,
  SessionRefreshMiddleware,
  SignedSessionCookieMiddleware,
  UserAccessTokenExpirationMiddleware,
  XSRFCookieHandler,
} from '../auth/middleware/index';
import oidc from '../config/oidc.config';
import apiAuth from '../config/api-auth.config';
import { HealthService } from '../health/health.service';
import { OtelModule } from '../otel/otel.module';
import { VersionController } from '../fluxnova/version/version.controller';
import { ExternalTaskController } from '../fluxnova/task/external-task.controller';
import { validate } from '../config/validator';
import { isRunningLocally } from '../common';
import { errorSerializer } from '../logging';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [oidc, apiAuth],
      validate,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          customProps: () => ({ context: 'HTTP' }),
          redact: !isRunningLocally()
            ? {
                paths: [
                  'req.headers.authorization',
                  'req.headers.cookie',
                  'res.headers["set-cookie"]',
                  `req.headers["${configService.get('FXN_IDENTITY_HEADER_KEY', DEFAULT_IDENTITY_HEADER_KEY)}"]`,
                ],
                censor: '*** REDACTED ***',
              }
            : undefined,
          useLevel: 'trace',
          level: configService.get('FXN_LOG_LEVEL', 'error'),
          autoLogging: configService.get('FXN_HTTP_AUTO_LOGGING', false),
          formatters: {
            level: (label: string) => ({ level: label?.toUpperCase() }),
          },
          messageKey: 'message',
          serializers: {
            err: errorSerializer,
            cause: errorSerializer,
            error: errorSerializer,
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res,
          },
          stream: isRunningLocally()
            ? pretty({
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                levelFirst: true,
                ignore: 'pid,hostname',
                messageKey: 'message',
                colorizeObjects: true,
              })
            : undefined,
        },
      }),
    }),
    AuthenticationModule,
    OtelModule,
    StaticAssetsModule,
  ],
  controllers: [
    AuthorizationController,
    BatchController,
    DecisionDefinitionController,
    DeploymentController,
    IncidentController,
    JobController,
    MigrationController,
    ProcessDefinitionController,
    ProcessInstanceController,
    VariableController,
    DecisionDefinitionController,
    DecisionRequirementsDefinitionController,
    DecisionInstanceController,
    ApplicationRoutesController,
    HealthController,
    VersionController,
    UserTaskController,
    ExternalTaskController,
  ],
  providers: [
    HealthService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SignedSessionCookieMiddleware,
        cookieParser(),
        doubleCsrfProtection,
        XSRFCookieHandler,
        compression(),
        SessionRefreshMiddleware,
        UserAccessTokenExpirationMiddleware,
      )
      .forRoutes('*');
  }
}
