import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableFilterMenuComponent } from './data-table-filter-menu.component';

describe('DataTableFilterMenuComponent', () => {
  let component: DataTableFilterMenuComponent;
  let fixture: ComponentFixture<DataTableFilterMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataTableFilterMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableFilterMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
