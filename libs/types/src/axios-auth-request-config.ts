import { InternalAxiosRequestConfig } from 'axios';

export interface AxiosAuthRequestConfig extends InternalAxiosRequestConfig {
  skipDefaultAuth?: boolean;
}
