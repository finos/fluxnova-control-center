/* eslint-disable n/no-process-env -- This runs before the config service is initialized so we have to use process.env */

import { registerAs } from '@nestjs/config';
import type { ApiAuthConfig } from '@fxn/types';

export const apiAuthConfigFactory = async (): Promise<ApiAuthConfig> => {
  const authEnabled = process.env.FXN_API_AUTH_ENABLED === 'true';

  return {
    authEnabled,
    clientId: authEnabled ? process.env.FXN_API_AUTH_CLIENT_ID || '' : '',
    clientSecret: authEnabled ? process.env.FXN_API_AUTH_CLIENT_SECRET || '' : '',
    tokenURL: authEnabled ? process.env.FXN_API_AUTH_TOKEN_URL || '' : '',
    requestHeaderName: process.env.FXN_API_AUTH_REQUEST_HEADER_NAME ?? 'Authorization',
  };
};

export default registerAs('apiAuth', apiAuthConfigFactory);
