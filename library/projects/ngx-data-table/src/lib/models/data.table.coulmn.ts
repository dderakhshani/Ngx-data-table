import { TemplateRef } from '@angular/core';
import { Validators } from '@angular/forms';

export class DataTableColumn {

    constructor(init: (Partial<DataTableColumn> & Pick<DataTableColumn, 'title' | 'fieldName' | 'fieldType'>)) {
        Object.assign(this, init);

        this.title = init.title;
        this.fieldName = init.fieldName;
        this.fieldType = init.fieldType;

        if (!this.valueFieldName)
            this.valueFieldName = this.fieldName;

        if (!this.groupingField)
            this.groupingField = this.fieldName;

        if (!this.orderingFields)
            this.orderingFields = [this.fieldName];

    }

    //selected: boolean;
    title: string;
    fieldName: string;
    disabledFieldName?: string;
    visibleFieldName?: string;
    valueFieldName?: string;
    groupingField?: string;
    orderingFields?: string[];
    fieldType: FieldType;
    displayFormat?: string;
    itemsSource?: DataDropDown;
    validators?: Validators;
    filterable: boolean = true;
    editable: boolean = false;
    editableFieldName?: string;
    sortable: boolean = true;
    resizable: boolean = true;
    rowTextAlign: 'left' | 'center' | 'right' = 'left';
    headerTextAlign: 'left' | 'center' | 'right' = 'left';
    showInFooter: boolean = false;
    footerAggregate?: Aggregates;
    hint?: string;
    width?: string;
    icon?: string;
    placeholder?: string;
    templateRef?: TemplateRef<any>;
}


export interface DataTableDisplayPreset {
    title: string;
    columnsToShow: DataTableColumn[];
}

export interface DataDropDown {
    displayFieldName: string;
    valueFieldName: string;
    enabledFieldName?: string | null;
    items: any[]
}

export enum FieldType {
    Text = "text",
    Time = "time",
    Date = "date",
    Tel = "tel",
    Number = "number",
    Currency = "currency",
    Email = "email",
    CheckBox = "checkbox",
    DropDown = "dropdown",
    CopyPasteAction = "CopyPasteAction",
    SelectAction = "SelectAction",
    ActionTemplate = "ActionTemplate"
}

export enum Aggregates {
    Sum = "Sum",
    Avg = "Average",
    Count = "Count",
    Min = "Min",
    Max = "Max",
    Custom = "Custom",
}

export class Group {
    level = 0;
    parent!: Group;
    expanded = true;
    totalCounts = 0;
    [key: string]: any;
    get visible(): boolean {
        return !this.parent || (this.parent.visible && this.parent.expanded);
    }
}

export interface ExportToExcelParams {
    apiSubPath: string,
    fileName?: string
}
