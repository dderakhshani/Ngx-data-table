import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTatableFiltersHeaderComponent } from './data-tatable-filters-header.component';

describe('DataTatableFiltersHeaderComponent', () => {
  let component: DataTatableFiltersHeaderComponent;
  let fixture: ComponentFixture<DataTatableFiltersHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataTatableFiltersHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTatableFiltersHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
