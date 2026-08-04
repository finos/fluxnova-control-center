import * as jwt from 'jsonwebtoken';

export function getTimeUntilTokenExpiration(token: string): number {
  try {
    const decodedToken = jwt.decode(token, { json: true });
    const exp = (decodedToken?.exp || 0) * 1000;
    return exp - Date.now();
  } catch {
    return 0;
  }
}
