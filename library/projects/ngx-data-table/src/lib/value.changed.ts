import { FormGroup } from '@angular/forms';
import { QueryConfig } from './models/grid-config.model';
import { QueryParamModel } from './models/query-param-model';
export default interface ValueChangedEvent {
    fieldName: string;
    form: FormGroup
}

export interface DataStateChangeEvent {
    queryParams: QueryParamModel;
    queryConfig: Omit<QueryConfig, 'columnsNamesToShow'>
}