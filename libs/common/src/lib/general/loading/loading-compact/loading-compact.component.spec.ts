import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingCompactComponent } from './loading-compact.component';

describe('LoadingCompactComponent', () => {
  let component: LoadingCompactComponent;
  let fixture: ComponentFixture<LoadingCompactComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoadingCompactComponent],
    });
    fixture = TestBed.createComponent(LoadingCompactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
