import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MoveTokenService {
  moveToken$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor() {}

  public emitTokenMove(value: any): void {
    this.moveToken$.next(value);
  }

  public onTokenMove(): Observable<any> {
    return this.moveToken$.asObservable();
  }
}
