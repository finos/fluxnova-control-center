import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UriUtilsService {
  getBaseHref(): string {
    const baseElement = document.getElementsByTagName('base').item(0);
    return baseElement?.getAttribute('href') ?? '';
  }
}
