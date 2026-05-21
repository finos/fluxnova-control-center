import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsViewComponent } from './tabs-view.component';

describe('SplitViewComponent', () => {
  let component: TabsViewComponent;
  let fixture: ComponentFixture<TabsViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabsViewComponent],
    });

    fixture = TestBed.createComponent(TabsViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
