
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { DataTableColumn, FieldType } from '../models/data.table.coulmn';
import { Condition } from '../models/condition-model';
import { CONDITIONS_FUNCTIONS, CONDITIONS_LIST, Filter } from '../models/filter-model';

@Component({
    selector: 'c-filter-menu',
    templateUrl: './data-table-filter-menu.component.html',
    styleUrls: ['./data-table-filter-menu.component.scss']
})
export class DataTableFilterMenuComponent implements OnInit {
    FieldType = FieldType;

    @Input()
    column!: DataTableColumn;

    @Input()
    filters?: { [key: string]: Filter[] | { [key: string]: Filter[] } };//recursive declaration : 

    filter!: Filter;
    filter2!: Filter;

    @Output()
    filtersChange = new EventEmitter<any>();

    @ViewChild('menu', { static: true }) menu!: MatMenu;

    public conditionsList = CONDITIONS_LIST;
    public nextOprand: string = "and";


    constructor() {
        // this.filter = new Filter({
        //     condition: this.conditionsList[0],
        //     condition2: this.conditionsList[0],
        // });
    }

    ngOnInit(): void {
        this.filter = new Filter({
            //TODO: We are getting condition using index!!
            condition: this.conditionsList[0],
            // condition2: this.conditionsList[0],
            column: this.column
        });
        this.filter2 = new Filter({
            condition: this.conditionsList[0],
            column: this.column
        });
        if (this.filters) {
            // const cacheFilter = this.filters![this.column.fieldName];
            // if (cacheFilter?.value) {
            //     this.filter.value = cacheFilter.value;
            //     //TODO: We assumed here that the find function can always find a match, which in theory could be a wrong assumption. The reason is that operator is coming from different places. The blame is on the loose definition of CONDITIONS_LIST.
            //     this.filter.condition = this.conditionsList.find(x => x.operator == cacheFilter.condition.operator)!
            // }

            // if (cacheFilter?.value2 && cacheFilter.condition2) {
            //     this.filter.value2 = cacheFilter.value2;
            //     this.filter.condition2 = this.conditionsList.find(x => x.operator == cacheFilter.condition2!.operator)
            // }
        }
    }

    applyFilter() {
        const me = this;

        if (!this.filters) {
            this.filters = {}
        }

        if (this.filter2.value) {
            let filter: { [key: string]: Filter[] } = {};
            filter[this.column.fieldName] = [this.filter, this.filter2];//e.g {"fieldName":[filter1,filter2]}
            this.filters[this.nextOprand] = filter; //e.g {"or":  {"fieldName":[filter1,filter2]}}
        }
        else
            this.filters[this.column.fieldName] = [this.filter];

        this.filtersChange.emit(this.filters);
    }

    clearColumn(): void {
        if (this.filters) {
            delete this.filters[this.column.fieldName];
            this.filtersChange.emit(null);
        }

    }

}
