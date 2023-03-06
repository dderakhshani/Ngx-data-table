import { Condition } from "./condition-model";

export interface QueryParamModel {
    pagingProperties?: QueryPaging;
    group?: string;
    orderByProperties?: string;
    conditions?: Condition[];
    columnsNamesToShow: string[];
}

export interface QueryPaging {
    pageSize: number;
    pageIndex: number;
}
