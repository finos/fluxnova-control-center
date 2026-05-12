import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('Icon Component', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [IconComponent],
      providers: [],
      schemas: [],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('should return correct color based on color prop', () => {
    component.color = 'primary';
    expect(component.computedColor).toEqual('#024a7a');
    component.color = '#123456';
    expect(component.computedColor).toEqual('#123456');
  });

  it('should add the classes that are passed via prop', () => {
    expect(component.class).toEqual('fluxnova-icon');
    component.additionalClasses = 'an-extra-class';
    expect(component.class).toEqual('fluxnova-icon an-extra-class');
  });
});
