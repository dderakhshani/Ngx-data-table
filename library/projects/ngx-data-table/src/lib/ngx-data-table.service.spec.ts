import { TestBed } from '@angular/core/testing';

import { NgxDataTableService } from './ngx-data-table.service';

describe('NgxDataTableService', () => {
  let service: NgxDataTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxDataTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
