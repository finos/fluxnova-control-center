import { Logger } from '@nestjs/common';

export interface RequestState {
  returnTo?: string;
}

export function decodeState(encodedState: string, lgr: Logger): RequestState {
  let state: RequestState = { returnTo: '/' };
  try {
    state = JSON.parse(Buffer.from(encodedState, 'base64').toString()) || {};
    const returnTo = state?.returnTo;
    const isValidInternalPath =
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//') &&
      !returnTo.includes('\\') &&
      !/[\r\n\t]/.test(returnTo);

    if (!isValidInternalPath) {
      state.returnTo = '/';
    }
  } catch (error: any) {
    lgr.warn({ error }, 'problem parsing request state');
  }
  return state;
}
