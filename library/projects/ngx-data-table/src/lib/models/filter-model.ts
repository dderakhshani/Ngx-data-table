import { Validators } from '@angular/forms';
import { DataTableColumn } from './data.table.coulmn';
import { Condition } from "./condition-model";

export class Filter {

    constructor(init: (Partial<Filter> & Pick<Filter, 'column' | 'condition' | 'value'>)) {
        Object.assign(this, init);
        this.column = init.column;
        this.condition = init.condition;
    }
    value?: any;
    condition: { label: string, symbol: string, operator: string };

    // value2?: any;
    // condition2?: { label: string, symbol: string, operator: string };

    column: Pick<DataTableColumn, 'title' | 'fieldName' | 'fieldType' | 'valueFieldName'>;
    toServerCondition(): Condition {
        // const conditions: Condition[] = [];
        // conditions.push();
        // if (this.value2 && this.condition2)
        //     conditions.push({
        //         propertyName: this.column.valueFieldName ?? this.column.fieldName,
        //         comparison: this.condition2.operator,
        //         values: [this.value2],
        //     });
        return {
            propertyName: this.column.valueFieldName ?? this.column.fieldName,
            comparison: this.condition.operator,
            values: [this.value],
        };
    }
}


//TODO: This way means that we will need to get condition using index!!
export const CONDITIONS_LIST = [
    { label: "Equal to", symbol: "=", operator: "e" },
    { label: "Contains", symbol: "Contains", operator: "contains" },
    { label: "Not Equal", symbol: "<>", operator: "ne" },
    { label: "Greater than", symbol: ">", operator: "gt" },
    { label: "Greater or equal", symbol: ">=", operator: "gte" },
    { label: "Less than", symbol: "<", operator: "lt" },
    { label: "Less or equal", symbol: "<=", operator: "lte" },
    { label: "Is Null", symbol: "Is Null", operator: "n" },
    { label: "Is not Null", symbol: "Not Null", operator: "nn" },
];

export const CONDITIONS_FUNCTIONS = { // search method base on conditions list value
    "is-empty": function (value: any, filterdValue: any) {
        return value === "";
    },
    "is-not-empty": function (value: any, filterdValue: any) {
        return value !== "";
    },
    "is-equal": function (value: any, filterdValue: any) {
        return value == filterdValue;
    },
    "is-not-equal": function (value: any, filterdValue: any) {
        return value != filterdValue;
    }
};
