import { isEmpty } from 'lodash-es';
import { AuthStrategy } from '../auth/strategies/strategies.enum';

const validator = (env: Record<string, any>, requiredVars: string[], conditionMessage: string) => {
  const unsetVars: string[] = requiredVars.filter((envVar: string) => isEmpty(env[envVar]));

  if (unsetVars.length) {
    throw new Error(
      `${conditionMessage} but ${unsetVars.length < 2 ? unsetVars[0] : unsetVars.join(', ')} ${unsetVars.length > 1 ? 'are' : 'is'} missing. Ensure these env variables are properly configured.`,
    );
  }
};

export const validate = (env: Record<string, any>) => {
  // Validate that if oidc auth is enabled, all required env vars are set
  if (env.FXN_AUTH_STRATEGY === AuthStrategy.oidc) {
    const requiredVars = [
      'FXN_OIDC_AUTHORITY',
      'FXN_OIDC_AUTH_URL',
      'FXN_OIDC_CLIENT_ID',
      'FXN_OIDC_CLIENT_SECRET',
      'FXN_OIDC_ISSUER',
      'FXN_OIDC_TOKEN_URL',
      'FXN_OIDC_USERINFO_URL',
    ];

    validator(env, requiredVars, 'OIDC Authentication is enabled');
  }

  // Validate that if api auth is enabled, all required env vars are set
  if (env.FXN_API_AUTH_ENABLED === 'true') {
    const requiredVars = ['FXN_API_AUTH_CLIENT_ID', 'FXN_API_AUTH_CLIENT_SECRET', 'FXN_API_AUTH_TOKEN_URL'];

    validator(env, requiredVars, 'API Authentication is enabled');
  }

  // Validate that when deployed to an environment CSRF key is set
  if (!isEmpty(env.FXN_PUBLIC_URL) && !env.FXN_PUBLIC_URL.includes('localhost'))
    validator(env, ['FXN_CSRF_KEY'], 'Application is not running locally');

  return env;
};
