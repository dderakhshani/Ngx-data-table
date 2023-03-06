import { DataTableColumn } from './../models/data.table.coulmn';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FieldType } from '../models/data.table.coulmn';
import { Filter } from '../models/filter-model';

@Component({
    selector: 'c-data-table-filters-header',
    templateUrl: './data-tatable-filters-header.component.html',
    styleUrls: ['./data-tatable-filters-header.component.scss']
})
export class DataTatableFiltersHeaderComponent implements OnInit {

    FieldTypes = FieldType;

    Object = Object;
    @Input()
    filters?: { [key: string]: Filter[] | { [key: string]: Filter[] } };
    @Output()
    filtersChanged = new EventEmitter<any>();

    operator = "";

    constructor() { }

    ngOnInit(): void {
    }

    getFilters(key: string): Filter[] {
        if (this.filters)
            //there is only single key

            if (key == 'and' || key == 'or') {
                this.operator = key;
                let filter2 = this.filters[key] as { [key: string]: Filter[] };

                for (const key2 of this.Object.keys(filter2))//only one key
                    return filter2[key2] as Filter[];
            }
            else if (Array.isArray(this.filters[key])) {

                return this.filters[key] as Filter[];
            }
            else
                return [this.filters[key] as any];//fix old cache data

        return [];

    }

    getFilter2() {

    }

    removeFilter(key: any) {
        if (this.filters) {
            delete this.filters[key];
            this.filtersChanged.emit(this.filters);
        }
    }

    removeAll() {
        this.filters = {};
        this.filtersChanged.emit(this.filters);
    }

    getDropDownValue(column: any, value: any) {
        const item = column.itemsSource.items.find((x: any) => x.value == value);
        return item[column.itemsSource?.displayFieldName ?? 0];
    }

}







