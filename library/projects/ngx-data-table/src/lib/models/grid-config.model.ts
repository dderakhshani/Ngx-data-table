import { Sort } from "@angular/material/sort";
import { Filter } from "./filter-model";
import { QueryParamModel } from "./query-param-model";

export enum GridConfigDisplayType {
    Rows = 1,
    RowCard = 2,
    Card = 3
}
export class GridUserConfig {
    constructor(init: (Partial<GridUserConfig> & Pick<GridUserConfig, 'name' | 'query'>)) {

        Object.assign(this, init);
        this.name = init.name;
        this.query = init.query;
        //this.name = name;
        //this.query = query;

    }


    gridConfigId?: number;
    presetName?: string;
    name: string;
    usage?: string;
    displayType: GridConfigDisplayType = GridConfigDisplayType.Rows;

    //queryData: string | null = null;
    query: QueryConfig;
}

export interface QueryConfig {
    groupByFields?: string[],
    sorts?: Sort[],
    filters?: { [key: string]: Filter[] | { [key: string]: Filter[] } },
    columnsNamesToShow: string[]
}

export class GridStaticConfig {
    options: GridConfigOptions = new GridConfigOptions();
    appearance: GridConfigAppearance = new GridConfigAppearance();

}

//TODO: equivalent of this class in back-end, and maybe using auto mapper there
export class GridConfigOptions {
    showTotals?: boolean = true;
    grouping?: boolean = true;
    exportable?: boolean = true;
    paging?: boolean = true;
    serverPaging?: boolean = true;
    filtering?: boolean = true;
    serverFiltering?: boolean = true;
    sorting?: boolean = true;
    serverSorting?: boolean = true;
    rowEditMode: 'never' | 'always' | 'onDoubleClick' | 'bySelection' = 'never';
    copyPasteRowEnabled: boolean = false;

    public constructor(init?: Partial<GridConfigOptions>) {
        Object.assign(this, init);
    }
}

//TODO: equivalent of this class in back-end, and maybe using auto mapper there
export class GridConfigAppearance {
    height?: string = "100%";
    groupingMessage: string = "";

    showToolbar: boolean = true;

    public constructor(init?: Partial<GridConfigAppearance>) {
        Object.assign(this, init);
    }
}



export const GridDefaultSettings: GridStaticConfig = {
    appearance: new GridConfigAppearance({ showToolbar: false }),
    options: new GridConfigOptions({ grouping: false, sorting: false, filtering: false })
}

export const GridEditableSettings: GridStaticConfig = {
    appearance: new GridConfigAppearance({ showToolbar: false }),
    options: new GridConfigOptions({ grouping: false, sorting: false, filtering: false, rowEditMode: 'always' })
}

export const GridFullFeatureClientBaseSettings: GridStaticConfig = {
    appearance: new GridConfigAppearance({ showToolbar: true }),
    options: new GridConfigOptions({ grouping: true, sorting: true, filtering: true, exportable: true })
}

export const GridFullFeatureServerBaseSettings: GridStaticConfig = {
    appearance: new GridConfigAppearance({ showToolbar: true }),
    options: new GridConfigOptions({
        grouping: true, sorting: true, filtering: true, exportable: true,
        serverFiltering: true, serverPaging: true, serverSorting: true
    })
}

export const GridCopyPastSimpleSettings: GridStaticConfig = {
    appearance: new GridConfigAppearance({ showToolbar: false }),
    options: new GridConfigOptions({ grouping: false, sorting: false, filtering: false, rowEditMode: 'always', copyPasteRowEnabled: true })
}
// export type GridConfigWithoutPreset = Omit<GridConfig, 'presetName' | 'usage' | 'gridConfigId'>;