import { NgModule } from '@angular/core';
import { NgxDataTableComponent } from './ngx-data-table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTableExporterModule } from 'mat-table-exporter';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableResponsiveDirective } from './mat-table-responsive/mat-table-responsive.directive';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataTableFilterMenuComponent } from './data-table-filter-menu/data-table-filter-menu.component';
import { DataTatableFiltersHeaderComponent } from './data-tatable-filters-header/data-tatable-filters-header.component';
import { ColumnChooserComponent } from './column-chooser/column-chooser.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@NgModule({
    declarations: [
        NgxDataTableComponent,
        MatTableResponsiveDirective,
        DataTableFilterMenuComponent,
        DataTatableFiltersHeaderComponent,
        ColumnChooserComponent,
        ConfirmDialogComponent
    ],
    exports: [
        NgxDataTableComponent,
        MatTableResponsiveDirective,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,

        MatTableModule,
        DragDropModule,
        MatPaginatorModule,
        MatMenuModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatListModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatChipsModule,
        MatCheckboxModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        CdkTableModule,
        MatSortModule,

        // MatTableExporterModule
    ]
})
export class NgxDataTableModule { }
