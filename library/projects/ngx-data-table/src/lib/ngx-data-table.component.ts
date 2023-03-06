
import { Filter } from './models/filter-model';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Aggregates, DataTableColumn, ExportToExcelParams, FieldType, Group } from './models/data.table.coulmn';
import { Subscription, Observable, Subject } from 'rxjs';
import { debounceTime, switchMap, take } from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import ValueChangedEvent, { DataStateChangeEvent } from './value.changed';
import { ColumnChooserComponent } from './column-chooser/column-chooser.component';
import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { MatSelectChange } from '@angular/material/select';

import { GridUserConfig, GridConfigDisplayType, GridStaticConfig } from './models/grid-config.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx';
import { Condition } from './models/condition-model';
import { ConfirmDialogComponent, ConfirmDialogModel } from './confirm-dialog/confirm-dialog.component';

const CalcFieldPostfix = "CalcField";

@Component({
    selector: 'ngx-data-table',
    templateUrl: './ngx-data-table.component.html',
    styleUrls: ['./ngx-data-table.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class NgxDataTableComponent implements OnInit {


    private componentSubscriptions = new Subscription();

    public fieldType = FieldType;
    public aggergates = Aggregates;
    public gridConfigDisplayType = GridConfigDisplayType;

    form!: FormGroup;
    copyMode = false;
    selectedRowForm?: FormGroup;
    editRowForm?: FormGroup;
    //view_mode: 'rows' | 'rows-card' | 'grid' = 'rows'
    filter_area = false;
    //filters: { [key: string]: Filter } = {};
    prev_sort!: Sort;

    @ViewChild("gridTable", { static: true }) protected _table!: ElementRef;

    public readonly pagingInfo = {
        total: 0,
        pageIndex: 0,
        pageSize: 20
    };

    @Input() public settings!: GridStaticConfig;

    //TODO: the type of this is GridConfig minus preset and Id
    @Input() public defaultConfig!: GridUserConfig;

    @Input() public currentConfig!: GridUserConfig;

    @Input() public exportToExcelParams?: ExportToExcelParams;

    @Input()
    isLoading = false;

    public _allColumns: (DataTableColumn & { visible?: boolean })[] = [];
    @Input()
    set allColumns(value: DataTableColumn[]) {
        // we set visibility of columns later in ngOnInit
        this._allColumns = value;
        //this._allColumns.forEach(x => { x.selected = true });
        //this.dataColumns = this._allColumns;
    }

    @Input() flatten: boolean = true;

    // See formats https://angular.io/api/common/DatePipe#pre-defined-format-options
    @Input() defaultDateFormat: string = 'd MMM y';

    public getVisibleColumns() {
        return this._allColumns.filter(cl => cl.visible || cl.fieldType == FieldType.ActionTemplate || cl.fieldType == FieldType.CopyPasteAction);
    }

    public displayPresets?: GridUserConfig[];

    @Input()
    loadDisplayPresets$!: Observable<GridUserConfig[]>;

    private loadDisplayPresetSubject = new Subject<void>();

    //_selectedDisplayPreset?: GridConfig;
    private setSelectedDisplayPreset(value?: GridUserConfig) {
        if (value) {
            //preserve filters while changing display preset?
            this.currentConfig = value;
            this.parseFilters();
            this._allColumns.forEach(x => {
                this.changeColumnVisibility(this.currentConfig!.query.columnsNamesToShow.some(name => name === x.fieldName), x.fieldName);
            });
        }
    }

    /**
     * selectedPresetChanged
     */
    public selectedPresetChanged(event: MatSelectChange) {
        this.setSelectedDisplayPreset(this.displayPresets?.find(dp => dp.gridConfigId === event.value));

        //TODO: calling this method is a bit of mess and arbitrary. The danger is that we show a column while the data not refreshed.
        this.onStateChange();
    }

    //groupByColumns: DataTableColumn[] = [];

    _dataSource = new MatTableDataSource<any | Group>([]);
    @Input()
    set dataSource(value: any[]) {

        const flatData = this.flattenArray(value);
        this._dataSource.data = this.addGroups(flatData, this.currentConfig?.query.groupByFields ?? []);

        //this._dataSource.data is Already Flat
        const rowsFormArray = this.mapToNestedFormControl(this._dataSource.data, Validators.max);
        this.form = this._formBuilder.group({
            rows: rowsFormArray
        });

        //Must be called after creating form
        this._dataSource.filterPredicate = this.customFilterPredicate.bind(this);
        this._dataSource.filter = performance.now().toString();
        this.formRowsChange.emit(this.rows);
    }

    customFilterPredicate(data: any | Group, filter: string): boolean {
        return (data instanceof Group) ? data.visible : this.getDataRowVisible(data);
    }

    @Input()
    set totalRecords(value: number) {
        this.pagingInfo.total = value;
    }

    @Input()
    formRows!: FormArray;

    @Input()
    onDisplayPresetsSaveCallback?: (configToSave: GridUserConfig, isSaveAs: boolean) => Observable<GridUserConfig>;
    @Input()
    onDisplayPresetsDeleteCallback?: (gridConfigId: number) => Observable<void>;

    @Output()
    formRowsChange = new EventEmitter<FormArray>();

    @Output()
    onItemClick = new EventEmitter<any>();

    @Output()
    onValueChanges = new EventEmitter<ValueChangedEvent>();

    @Output()
    stateChange = new EventEmitter<DataStateChangeEvent>();


    @Output()
    export = new EventEmitter<string>();


    constructor(private _formBuilder: FormBuilder, public dialog: MatDialog, private changeDetectorRefs: ChangeDetectorRef, private http: HttpClient) {

    }


    ngOnInit(): void {
        //create utility container form to contains forms of each row

        if (!this.defaultConfig?.name) {
            throw new Error("Internal Error: The default config for the data table must be set");
        }
        let cachedSettings = localStorage.getItem(`GridConfig_${this.defaultConfig.name}`);
        if (cachedSettings) {
            this.currentConfig = JSON.parse(cachedSettings);
            this.parseFilters();
        } else {
            this.currentConfig = this.deepCopy(this.defaultConfig);
        }

        this._allColumns.forEach(col => {
            if (this.currentConfig.query.columnsNamesToShow.some(name => name === col.fieldName)) {
                col.visible = true;
            } else {
                col.visible = false;
            }
        });

        if (this.settings.options.copyPasteRowEnabled && this._allColumns.find(x => x.fieldName == "cp-action") == null)
            this._allColumns.push(<DataTableColumn>{
                fieldName: "cp-action",
                title: "Copy Info",
                editable: true,
                fieldType: FieldType.CopyPasteAction,
                sortable: false,
            });

        //If preset Display is provided
        if (this.loadDisplayPresets$) {
            this.componentSubscriptions.add(
                this.loadDisplayPresetSubject
                    .pipe(
                        switchMap(() => this.loadDisplayPresets$)
                    )
                    .subscribe(displayPresets => this.displayPresets = displayPresets)
            );

            this.loadDisplayPresetSubject.next();
        }


        this.componentSubscriptions.add(

            this.columnCheckedSubject
                .pipe(
                    debounceTime(1500)
                )
                .subscribe(() => {
                    //TODO: better to not loading the grid by each change of column
                    // good to have debounce here
                    // having an apply button has two issues; 1. It may mean apply changes on the selected preset, 2. it immediately changes the visibility of the column while the data might have not provided in the query result.
                    this.onStateChange();
                })
        );

        // this.gridReloadSubject.subscribe(() => {
        //     this.triggerFetch();
        // })

    }

    ngOnDestroy(): void {
        this.componentSubscriptions.unsubscribe();
    }

    ngAfterViewInit() {
        //if (this.currentConfig.query.filters || this.currentConfig.query.sorts)
        this.onStateChange();

        //TODO: following:
        // this.componentSubscriptions.add(this._sort.sortChange.subscribe(result => {
        //     this.pagingInfo.pageIndex = 0
        //     this.onStateChange();
        // }));
    }

    private parseFilters() {
        // if (this.currentConfig.query?.filters)
        //     Object.keys(this.currentConfig.query.filters).forEach((key, index) => {
        //         if (!(this.currentConfig.query.filters![key] instanceof Filter))
        //             this.currentConfig.query.filters![key] = new Filter(this.currentConfig.query.filters![key]);
        //     });
    }

    private isDataColumn(column: DataTableColumn) {
        return column.fieldType != FieldType.SelectAction && column.fieldType != FieldType.CopyPasteAction && column.fieldType != FieldType.ActionTemplate
    }

    isCellEditable(column: DataTableColumn, row: FormGroup) {
        if (this.settings.options.rowEditMode == 'onDoubleClick' || this.settings.options.rowEditMode == 'bySelection')
            return (column.editableFieldName ? row.get(column.editableFieldName)?.value && column.editable : column.editable) && row == this.editRowForm;
        else if (this.settings.options.rowEditMode == 'always')
            return (column.editableFieldName ? row.get(column.editableFieldName)?.value && column.editable : column.editable);
        else
            return false;
    }

    /**
     * gridPage: will be fired grid wants to page
     */
    public gridPage(pageEvent: PageEvent) {
        this.pagingInfo.pageIndex = pageEvent.pageIndex;
        this.pagingInfo.pageSize = pageEvent.pageSize;
        this.onStateChange();
    }


    onSortChange(sort: Sort) {
        this.sortColumn(sort.active)
    }

    getSortState(field: string) {
        return this.currentConfig.query.sorts?.find(x => x.active == field)?.direction;
    }

    sortColumn(field: string) {
        this.currentConfig.query.sorts = this.currentConfig.query.sorts ?? [];
        const oldItem = this.currentConfig.query.sorts?.find(x => x.active == field);
        if (oldItem) {
            if (oldItem.direction == "asc")
                oldItem.direction = 'desc';
            else
                this.currentConfig.query.sorts?.splice(this.currentConfig.query.sorts?.indexOf(oldItem));
            this.sort(field, oldItem.direction);
        }
        else {

            this.currentConfig.query.sorts?.push(<Sort>{ active: field, direction: "asc" });
            this.sort(field, "asc");
        }



    }

    sort(fieldName: string, direction: string) {
        if (this.settings.options.serverSorting) {
            this.onStateChange();
            this.pagingInfo.pageIndex = 0;
        }
        else {
            var array = this.rows.value as Array<any>;
            const isAsc = direction === 'asc';

            array.sort((a, b) => {
                const propertyCC = this.camelCase(fieldName);
                return this.compare(a[propertyCC], b[propertyCC], isAsc);
            });
            //do sorting here with myArray.sort 
            this.updateRows = array;

            this.pagingInfo.pageIndex = 0;
        }
    }

    compare(a: number | string, b: number | string, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    get rows(): FormArray {
        return this.form.get('rows') as FormArray;
    }

    set updateRows(value: Array<any>) {
        this.form.get('rows')?.patchValue(value);
    }

    onItemChange(event: any, form: FormGroup, fieldName: string) {
        // if (isDevMode())
        //     console.log("value changed");

        const fieldValue = form.get(fieldName)?.value;
        // if (isDevMode())
        //     console.log(fieldValue);

        this.onValueChanges.emit(<ValueChangedEvent>{
            fieldName: fieldName,
            form: form
        });

        //NOTE: Unflatten/Flatten causes missing access to original form so new form is not dirty
        const data = this.unflatten(this.rows.getRawValue());
        const fgRows = this.mapToNestedFormControl(data, null) as FormArray;
        fgRows.markAsDirty();
        this.formRowsChange.emit(fgRows);

    }

    onClickHandler(item: any) {
        this.onItemClick.emit(item);
    }

    onRowDoubleClick(row: FormGroup) {
        if (this.settings.options.rowEditMode == 'onDoubleClick') {
            this.editRowForm = row;
        }
    }

    getVisibleColumnsProps(): string[] {
        return this.getVisibleColumns().map((column: DataTableColumn) => column.fieldName);
    }

    camelCase(input: string) {
        if (input.length > 0)
            return input.split('.').map(l => l[0].toLowerCase() + l.substring(1)).join('.');
        else
            return input;
    }

    // testRow(row: FormGroup, fieldName: string) {
    //     console.log(row.get(fieldName)?.value);
    // }

    mapToNestedFormControl(data: any, validators?: Validators | null): AbstractControl {

        if (data != null && !Array.isArray(data) && typeof data === 'object') {

            const formGroupDescription: any = {};
            const keys = Object.keys(data);
            if (keys.length > 0) {
                keys.forEach(key => {
                    let column = this._allColumns.find(x => this.camelCase(x.fieldName) == key);

                    validators = this.getValidator(column);

                    formGroupDescription[key] = this.mapToNestedFormControl(data[key], validators);
                    validators = null;

                });
                return new FormGroup(formGroupDescription);
            }
            else
                return new FormControl(data, validators);
        } else if (data != null && Array.isArray(data)) {

            const formArrayDescription: any[] = [];
            data.forEach(elem => {
                formArrayDescription.push(this.mapToNestedFormControl(elem, validators));
            });
            return new FormArray(formArrayDescription);

        } else {

            return new FormControl(data, validators);

        }

    }

    // mapToFlatArrayForm(data: any, validators: Validators | ɵNullViewportScroller): AbstractControl {

    //     if (data != null && Array.isArray(data)) {

    //         const dataList: any[] = [];
    //         data.forEach(item => {
    //             dataList.push(this.flattenModel(item));
    //         });
    //         return this.mapToNestedFormControl(dataList, null);
    //     }

    //     return this.mapToNestedFormControl(this.flattenModel(data), null);
    // }

    private flattenModel(data: any) {
        if (!this.flatten)
            return data;
        const result: any = {};
        function recurse(obj: any, prop: string) {
            //if obj value is primitive type not Object
            if (Object(obj) !== obj || (obj instanceof Date)) {
                result[prop] = obj;
            } else if (prop.endsWith(CalcFieldPostfix) && obj.value) {
                result[prop] = obj.value;
            } else {
                let isEmpty = true;
                //for each property in obj
                for (const p in obj) {
                    isEmpty = false;
                    recurse(obj[p], prop ? prop + "." + p : p);
                }
                if (isEmpty)
                    result[prop] = obj; //TODO: I changed this line because it was not working at least for Date object. I still think there is a flaw over there that make a new object, i.e, result: any = {}
            }
        }
        recurse(data, "");
        return result;
    }

    private flattenArray(data: any[]) {
        if (!this.flatten)
            return data;
        const dataList: any[] = [];
        data.forEach(item => {
            dataList.push(this.flattenModel(item));
        });
        return dataList;
    }

    private unflatten(data: any): any {
        if (!this.flatten)
            return data;
        if (!Array.isArray(data) && typeof data === 'object') {
            let result = {}
            for (let p in data) {
                let keys = p.split('.')
                keys.reduce(function (r: any, e: any, index) {
                    return r[e] || (r[e] = isNaN(Number(keys[index + 1])) ? (keys.length - 1 == index ? data[p] : {}) : [])
                }, result)
            }
            return result;
        }
        else {
            let result = [];
            for (const item of data) {
                result.push(this.unflatten(item));
            }
            return result;
        }
    }

    private getValidator(column?: DataTableColumn) {
        if (column?.fieldType == FieldType.Tel)
            return Validators.pattern('[- +()0-9]+');
        else if (column?.fieldType == FieldType.Email)
            return Validators.email;
        else if (column?.fieldType == FieldType.Time)
            return Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/);
        else if (column != null)
            return column?.validators;
        else
            return null;
    }

    onCopy(row: any) {
        this.copyMode = true;
        this.selectedRowForm = row;

    }

    onCancelCopy() {
        this.copyMode = false;
        this.selectedRowForm = undefined;
    }

    onPaste(row: FormGroup) {
        for (const field in row.controls) {
            const col = this._allColumns.find(x => x.visible && this.camelCase(x.fieldName) == field);
            if (col?.editable) {
                const value = this.selectedRowForm?.get(field)?.value;
                row.get(field)?.setValue(value);
                row.markAsDirty();
            }

        }
    }

    onPasteAll() {
        for (let row of this.rows.controls) {

            if (row instanceof FormGroup) {
                // is a FormGroup  
            }
            if (this.selectedRowForm != row) { }
            this.onPaste(row as FormGroup);
        }
    }

    selectAll(value: MatCheckboxChange) {
        for (let row of this.rows.controls) {

            if (row instanceof FormGroup) {
                const col = this._allColumns.find(x => x.visible && x.fieldType == FieldType.SelectAction);
                if (col) {
                    row.get(col.fieldName)?.setValue(value.checked);
                    row.markAsDirty();
                }
            }
        }
    }

    public onFiltersChanged(filters: any) {
        this.onStateChange();
    }

    public onStateChange() {

        //this.gridReloadSubject.next();

        // converting array to Set makes it having unique values
        this.currentConfig.query.columnsNamesToShow = Array.from(new Set<string>(this.getVisibleColumns()
            .filter(x => this.isDataColumn(x))
            .map(cl => cl.fieldName))
        );
        let sorts = this.currentConfig.query.sorts?.filter(x => !x.active.endsWith(CalcFieldPostfix));

        let calcFieldSort = this.currentConfig.query.sorts?.filter(x => x.active.endsWith(CalcFieldPostfix));
        calcFieldSort?.forEach(cf => {
            const column = this._allColumns.find(x => x.fieldName == cf.active);
            if (column?.orderingFields) {
                column.orderingFields.forEach(o => {
                    sorts?.push(<Sort>{ active: o, direction: cf.direction })
                });
            }
        });
        let conditions: Condition[] = [];
        // if (this.currentConfig.query.filters) {
        //     const arr = Object.keys(this.currentConfig.query.filters)
        //         .map(key => {
        //             if (!(this.currentConfig.query.filters![key] instanceof Filter))
        //                 this.currentConfig.query.filters![key] = new Filter(this.currentConfig.query.filters![key]);
        //             return this.currentConfig.query.filters![key].toServerCondition();
        //         });
        //     conditions = arr.reduce(function (a, b) {
        //         return a.concat(b);
        //     }, []);
        // }


        this.stateChange.emit({
            queryParams: {
                pagingProperties: {
                    pageSize: this.pagingInfo.pageSize,
                    pageIndex: this.pagingInfo.pageIndex
                },
                group: this.currentConfig.query.groupByFields?.join(", ").trim() ?? "",
                columnsNamesToShow: this.currentConfig.query.columnsNamesToShow,
                conditions: conditions,
                orderByProperties: sorts?.map(x => x.active + " " + x.direction).join(", ").trim() ?? ""
            },
            queryConfig: this.currentConfig.query
        });

        this.saveUserConfig()
    }

    saveUserConfig() {
        //TODO: change the type of data being inserted into cache to not containing preset data.
        const configToWriteInCache = this.deepCopy(this.currentConfig);
        delete configToWriteInCache.gridConfigId;
        delete configToWriteInCache.presetName;

        localStorage.setItem(`GridConfig_${this.defaultConfig.name}`, JSON.stringify(configToWriteInCache));
    }

    setDisplayType(type: GridConfigDisplayType) {
        this.currentConfig.displayType = type;
        this.saveUserConfig();
    }

    private columnCheckedSubject = new Subject<void>();

    public columnChecked(checked: boolean, column: DataTableColumn) {
        this.changeColumnVisibility(checked, column.fieldName);

        this.columnCheckedSubject.next();

    }

    private changeColumnVisibility(visible: boolean, fieldName: string) {
        const columnIndexInShowList = this._allColumns.findIndex(cl => fieldName === cl.fieldName);
        if (columnIndexInShowList == -1) {
            throw new Error("Internal Error: selected column does not exist in the list.");
        }
        this._allColumns[columnIndexInShowList].visible = visible;
        if (this.isDataColumn(this._allColumns[columnIndexInShowList])) {
            const tempSet = new Set(this.currentConfig.query.columnsNamesToShow);
            if (visible) {
                tempSet.add(fieldName)
            } else {
                tempSet.delete(fieldName);
            }
            this.currentConfig.query.columnsNamesToShow = Array.from(tempSet);
        }
    }

    saveColumnList(creatingNewPreset: boolean) {


        if (creatingNewPreset) {

            //let columnList = <DataTableDisplayPreset>{ title: 'New', columnsToShow: this._allColumns };
            const dialogRef = this.dialog.open(ColumnChooserComponent, {
                maxWidth: "450px",
            });
            dialogRef.afterClosed()
                .pipe(
                    take(1),
                    switchMap((dialogResult: string) => {
                        let configToSave: GridUserConfig;
                        configToSave = this.deepCopy(this.currentConfig);
                        configToSave.presetName = dialogResult;
                        configToSave.gridConfigId = undefined;

                        return this.onDisplayPresetsSaveCallback!(configToSave, true);
                    }),
                    take(1)
                )
                .subscribe(result => {
                    this.loadDisplayPresetSubject.next();
                    this.setSelectedDisplayPreset(result);
                });
        }
        else {
            this.onDisplayPresetsSaveCallback!(this.currentConfig, false)
                .pipe(take(1))
                .subscribe();
            ;
        }

    }

    /**
     * removeSelectedPreset: removing the selected preset from database
     */
    public removeSelectedPreset(gridConfigId: number) {

        const message = `Are you sure you want to delete the display preset '${this.currentConfig?.presetName}'?`;

        const dialogData = new ConfirmDialogModel("Deleting Extra?", message);
        dialogData.MainActionTitle = "Yes, Delete";
        dialogData.CancelActionTitle = "Cancel";


        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            maxWidth: "450px",
            data: dialogData,
        });

        dialogRef.afterClosed().subscribe(dialogResult => {
            if (dialogResult) {
                this.onDisplayPresetsDeleteCallback!(gridConfigId)
                    .pipe(take(1))
                    .subscribe(() => {
                        this.loadDisplayPresetSubject.next();
                        this.currentConfig.gridConfigId = undefined;
                        this.currentConfig.presetName = undefined;
                    }
                    );
            }
        });


    }

    dragStarted(event: CdkDragStart, index: number) {

    }

    drop(event: CdkDragDrop<string[]>) {

        this.currentConfig.query.groupByFields = this.currentConfig.query.groupByFields ?? [];
        this.currentConfig.query.groupByFields.push((event.item.data.column as DataTableColumn).groupingField as string);
        // if (isDevMode()) {
        //     console.log('drop');
        //     console.log(event);
        //     console.log(this.currentConfig.query.groupByFields);
        // }
        this.onStateChange();
    }

    public getColumnByField(fieldName: string): DataTableColumn | undefined {
        return this._allColumns.find(cl => cl.fieldName === fieldName);
    }

    groupBy(event: any, column: string) {
        if (event)
            event.stopPropagation();
        this.checkGroupByColumn(column, true);
        const allData = this.rows.value as Array<any>;
        this.dataSource = this.addGroups(allData, this.currentConfig.query.groupByFields || []);
        this._dataSource.filter = performance.now().toString();

        // this.changeDetectorRefs.detectChanges();
    }

    unGroupBy(event: any, column: string) {
        if (event)
            event.stopPropagation();
        this.checkGroupByColumn(column, false);
        this.onStateChange();
        // const allData = this.rows.value as Array<any>;
        // this.dataSource = this.addGroups(allData, this.groupByColumns);
        // this._dataSource.filter = performance.now().toString();
    }


    checkGroupByColumn(field: string, add: boolean) {
        if (!this.currentConfig.query.groupByFields) {
            this.currentConfig.query.groupByFields = [];
        }
        let found = null;
        for (const column of this.currentConfig.query.groupByFields) {
            if (column === field) {
                found = this.currentConfig.query.groupByFields.indexOf(column, 0);
            }
        }
        if (found != null && found >= 0) {
            if (!add) {
                this.currentConfig.query.groupByFields.splice(found, 1);
            }
        } else {
            if (add) {
                this.currentConfig.query.groupByFields.push(field);
            }
        }
    }

    addGroups(data: any[], groupByFields: string[]): any[] {
        const rootGroup = new Group();
        rootGroup.expanded = true;
        return this.getSublevel(data, 0, groupByFields, rootGroup);
    }

    getSublevel(data: any[], level: number, groupByFields: string[], parent: Group): any[] {

        //End of call sublevel
        if (level >= groupByFields.length) {
            return data;
        }

        const groupRows = this.uniqueBy(
            data.map(
                row => {
                    const result = new Group();
                    result.level = level + 1;
                    result.parent = parent;
                    for (let i = 0; i <= level; i++) {
                        //Create a field based on Column name and set its value
                        //For example if group is by Color field result.Color=White
                        result[groupByFields[i]] = row[groupByFields[i]];
                    }
                    return result;
                }
            ),
            JSON.stringify);

        const currentField = groupByFields[level];
        let subGroups: Group[] = [];

        groupRows.forEach((group: Group) => {
            const rowsInGroup = data.filter(row => group[currentField] === row[currentField]);
            group.totalCounts = rowsInGroup.length;
            const subGroup = this.getSublevel(rowsInGroup, level + 1, groupByFields, group);
            subGroup.unshift(group);
            subGroups = subGroups.concat(subGroup);
        });
        return subGroups;
    }

    getDataRowVisible(data: FormGroup): boolean {
        const groupRows = this.form.getRawValue().rows.filter(
            (row: any) => {
                if (!(row.level)) {
                    return false;
                }
                let match = true;
                if (data.controls)//No Idea why data.controls is undefined for the first time
                    (this.currentConfig.query.groupByFields || []).forEach(column => {
                        if (!row[column] || !data.controls[column]?.value || row[column] !== data.controls[column]?.value) {
                            match = false;
                        }
                    });
                return match;
            }
        );

        if (groupRows.length === 0) {
            return true;
        }
        const parent = groupRows[0] as Group;
        if (parent.visible)
            return parent.visible && parent.expanded;
        else
            return parent.expanded;
    }

    groupHeaderClick(row: FormGroup) {
        const expanded = row.get("expanded")?.value;
        row.get("expanded")?.setValue(!expanded);
        this._dataSource.filter = performance.now().toString();  // bug here need to fix
    }

    uniqueBy(a: any[], modifier: any) {
        const seen: any = {};
        return a.filter((item) => {
            const k = modifier(item);
            return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        });
    }

    isGroup(index: number, item: any): boolean {
        return item.get("level")?.value;
    }

    getGroupColumn(group: FormGroup): DataTableColumn | undefined {
        if (this.currentConfig.query.groupByFields) {
            const index = group.get("level")?.value - 1;
            if (this.currentConfig.query.groupByFields.length > index) {
                return this.getColumnByField(this.currentConfig.query.groupByFields[index]);
            }
        }
        return undefined;
    }

    getGroupValue(group: FormGroup, column?: DataTableColumn) {
        if (!column) {
            return undefined;
        }
        return group.controls[column.fieldName]?.value;
    }

    showFooter() {
        //Note: of can filter only visible columns it's possible
        // but footer row may be visible/invisible during column selection
        return this._allColumns.filter(x => x.showInFooter).length > 0;
    }

    getColumnAgg(column: DataTableColumn) {
        if (column.footerAggregate == Aggregates.Sum) {
            let sum = 0;
            this.rows.controls.forEach(row => {
                if ((row as FormGroup).controls[column.fieldName])
                    sum += parseFloat((row as FormGroup).controls[column.fieldName].value)
            })
            return sum;
        }
        return 0;
    }

    getSelectFormControlName(row: FormGroup, column: DataTableColumn) {
        const fieldName = this.camelCase(column.fieldName);
        let selectRow = row.get(fieldName);
        if (!selectRow) {
            row.addControl(fieldName, new FormControl(false))
        }
        return fieldName;
    }

    onExportToExcel() {
        if (!this.exportToExcelParams) {
            throw new Error("Internal Error: export to excel called without parameters being set.");
        }
        const columns = this.getVisibleColumns().map(x => ({ title: x.title, dataKey: x.fieldName }));

        const rows: any[] = [];
        this._dataSource.data.forEach((rowJson, index, array) => {
            let row: any = {};
            columns.forEach((col: any) => {
                let content = rowJson[col.dataKey];

                //Format Date Field if necessary
                const dataColumn = this._allColumns.find(x => x.fieldName == col.dataKey);
                if (dataColumn?.fieldType == FieldType.Date)
                    if (content && !(content instanceof Date))
                        content = new Date(content).toDateString();

                row[col.title] = content;
            });
            rows.push(row);
        });


        const workSheet = XLSX.utils.json_to_sheet(rows, { header: columns.map(x => x.title) });

        columns.forEach((col: any) => {
            const dataColumn = this._allColumns.find(x => x.fieldName == col.dataKey);
            if (dataColumn?.fieldType == FieldType.Currency) {
                this.formatExcelColumn(workSheet, col.title, '$0.00');
            }
        });

        const workBook: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, 'SheetName');
        XLSX.writeFile(workBook, this.exportToExcelParams.fileName ?? `${this.currentConfig.name}.xlsx`);
    }

    formatExcelColumn(worksheet: XLSX.WorkSheet, col: any, fmt: string) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] as string)
        // note: range.s.r + 1 skips the header row
        for (let row = range.s.r + 1; row <= range.e.r; ++row) {
            const ref = XLSX.utils.encode_cell({ r: row, c: col })
            if (worksheet[ref] && worksheet[ref].t === 'n') {
                worksheet[ref].z = fmt
            }
        }
    }

    onExportPdf() {
        // if (isDevMode())
        //console.log('Export PDF');
        var doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(this.currentConfig.name, 11, 8);
        doc.setFontSize(11);
        doc.setTextColor(100);

        const columns = this._allColumns.filter(cl => cl.visible).map(x => ({ title: x.title, dataKey: x.fieldName }));
        const rows: any[] = [];
        this._dataSource.data.forEach((rowJson, index, array) => {
            let row: any[] = [];
            columns.forEach((col: any) => {
                let content = rowJson[col.dataKey];
                const dataColumn = this._allColumns.find(x => x.fieldName == col.dataKey);
                if (dataColumn?.fieldType == FieldType.Date)
                    if (content)
                        content = new Date(content).toDateString();
                row.push(content);
            });
            rows.push(row);
        });

        //NOTE in library autoTable become an object of module and default is autoTable function, I have no idea why
        (autoTable as any).default(doc, {
            head: [columns],
            body: rows,
        });

        // if (isDevMode())
        //     console.log(columns);

        // below line for Open PDF document in new tab
        doc.output('dataurlnewwindow')

        // below line for Download PDF document  
        doc.save(this.currentConfig.name + '_' + this.currentConfig.presetName + '.pdf');
    }




    private getDateString() {
        return new Date().toISOString().replace('T|:', '');
    }

    private deepCopy<T>(obj: T): T {
        let copy: any;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" !== typeof obj) {
            return obj;
        }

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return <any>copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepCopy(obj[i]);
            }
            return <any>copy;
        }

        // Handle Set
        if (obj instanceof Set) {
            copy = new Set();
            obj.forEach(value => {
                copy.add(this.deepCopy(value))
            });

            return <any>copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (const attr in obj) {
                if ((<any>obj).hasOwnProperty(attr)) {
                    (<any>copy)[attr] = this.deepCopy(obj[attr]);
                }
            }
            return <any>copy;
        }

        //throw new Error("Unable to copy obj! Its type isn't supported.");
        return obj;
    }
}
