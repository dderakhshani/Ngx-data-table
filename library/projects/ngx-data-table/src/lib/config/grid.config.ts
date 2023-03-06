import { GridConfig, GridConfigAppearance, GridConfigOptions } from 'ngx-data-table';

export const GridDefualtSettings: Partial<GridConfig> = {
    appearance: new GridConfigAppearance({ showToolbar: false }),
    options: new GridConfigOptions({ grouping: false, sorting: false, filtering: false })
}

export const GridFullFeatureClientBaseSettings: Partial<GridConfig> = {
    appearance: new GridConfigAppearance({ showToolbar: true }),
    options: new GridConfigOptions({ grouping: true, sorting: true, filtering: true, exportable: true })
}

export const GridFullFeatureServerBaseSettings: Partial<GridConfig> = {
    appearance: new GridConfigAppearance({ showToolbar: true }),
    options: new GridConfigOptions({
        grouping: true, sorting: true, filtering: true, exportable: true,
        serverFiltering: true, serverPaging: true, serverSorting: true
    })
}

export const GridCopyPastSimpleSettings: Partial<GridConfig> = {
    appearance: new GridConfigAppearance({ showToolbar: false }),
    options: new GridConfigOptions({ grouping: false, sorting: false, filtering: false })
}