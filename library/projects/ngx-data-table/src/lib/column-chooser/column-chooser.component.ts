import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-column-chooser',
    templateUrl: './column-chooser.component.html',
    styleUrls: ['./column-chooser.component.scss']
})
export class ColumnChooserComponent implements OnInit {

    title: string = ""
    constructor(public dialogRef: MatDialogRef<ColumnChooserComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ColumnChooserData) {
        // Update view with given values

    }

    ngOnInit() {
    }

    onConfirm(): void {
        this.dialogRef.close(this.title);
    }

    onDismiss(): void {
        // Close the dialog, return false
        this.dialogRef.close(false);
    }

}

export interface ColumnChooserData {

}
