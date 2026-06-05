import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarpinteriaComponent } from './carpinteria';

describe('CarpinteriaComponent', () => {
  let component: CarpinteriaComponent;
  let fixture: ComponentFixture<CarpinteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarpinteriaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarpinteriaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
