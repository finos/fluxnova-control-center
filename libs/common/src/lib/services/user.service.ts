import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Tenant, User } from '@fxn/types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _$user: ReplaySubject<User> = new ReplaySubject(1);
  private _$selectedTenant: ReplaySubject<Tenant> = new ReplaySubject(1);

  private _user?: User;
  private _selectedTenant?: Tenant;

  public set user(user: User) {
    this._$user.next(user);
    this._user = user;
  }

  public get user(): User | undefined {
    return this._user;
  }

  public get $user(): ReplaySubject<User> {
    return this._$user;
  }

  public set selectedTenant(tenant: Tenant) {
    this._$selectedTenant.next(tenant);
    this._selectedTenant = tenant;
  }

  public get selectedTenant(): Tenant | undefined {
    return this._selectedTenant;
  }

  public get $selectedTenant(): ReplaySubject<Tenant> {
    return this._$selectedTenant;
  }

  public get selectedTenantId(): string | undefined {
    return this.selectedTenant?.id;
  }
}
