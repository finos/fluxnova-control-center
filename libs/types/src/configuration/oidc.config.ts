export interface OIDCConfig {
  authority?: string;
  authorizationURL?: string;
  knownAuthorities?: string[];
  callbackURL: string;
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  scopes: string[];
  tokenURL?: string;
  userInfoURL?: string;
}
