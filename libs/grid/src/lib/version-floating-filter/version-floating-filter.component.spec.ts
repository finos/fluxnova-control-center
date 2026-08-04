import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IconComponent } from '@fxn/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { VersionFloatingFilterComponent } from './version-floating-filter.component';

describe('VersionFloatingFilterComponent', () => {
  let component: VersionFloatingFilterComponent;
  let fixture: ComponentFixture<VersionFloatingFilterComponent>;
  const mockRoute: { queryParams: Observable<any> } = {
    queryParams: of({
      toggleFilters: 'latestVersion',
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VersionFloatingFilterComponent, IconComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
      imports: [FormsModule, NgbModule],
    }).compileComponents();

    fixture = TestBed.createComponent(VersionFloatingFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set isLatestVersionSelected to true when Latest Version is selected', () => {
    expect(component.isLatestVersionSelected).toEqual(true);
  });
});
