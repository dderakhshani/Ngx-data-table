import {
    AfterViewInit,
    Directive,
    ElementRef,
    isDevMode,
    OnDestroy,
    OnInit,
    Renderer2
} from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { delay, map, mapTo, takeUntil } from 'rxjs/operators';

@Directive({
    selector: '[matTableResponsive]'
})
export class MatTableResponsiveDirective
    implements OnInit, AfterViewInit, OnDestroy {
    private onDestroy$ = new Subject<boolean>();

    private thead!: HTMLTableSectionElement;
    private tbody!: HTMLTableSectionElement;

    private theadChanged$ = new BehaviorSubject(true);
    private tbodyChanged$ = new Subject<boolean>();

    private theadObserver = new MutationObserver((mutations) => {
        // if (isDevMode())
        //     mutations.forEach(mutation => {
        //         console.log(mutation);
        //     });
        this.theadChanged$.next(true);
    });

    private tbodyObserver = new MutationObserver(() =>
        this.tbodyChanged$.next(true)
    );

    constructor(private table: ElementRef, private renderer: Renderer2) { }

    ngOnInit() {
        this.thead = this.table.nativeElement.querySelector('thead');
        this.tbody = this.table.nativeElement.querySelector('tbody');

        this.theadObserver.observe(this.thead, {
            childList: true,
            subtree: true
        });
        this.tbodyObserver.observe(this.tbody, { childList: true });
    }

    ngAfterViewInit() {
        //console.log('matTableResponsive: ngAfterViewInit')
        /**
         * Set the "data-column-name" attribute for every body row cell, either on
         * thead row changes (e.g. language changes) or tbody rows changes (add, delete).
         */
        combineLatest([this.theadChanged$, this.tbodyChanged$])
            .pipe(
                delay(1000),
                // mapTo({ headRow: this.thead.rows.item(0)!, bodyRows: this.tbody.rows }),
                map(() => {
                    const headRow = this.thead.rows.item(0)!;
                    const bodyRows = this.tbody.rows;
                    // console.log([...headRow.children]);
                    return {
                        columnNames: [...headRow.children].map(
                            headerCell => headerCell.textContent == null ? null! : headerCell.textContent?.replace('filter_alt', '')
                        ),
                        rows: [...bodyRows].map(row => [...row.children])
                    }
                }),
                takeUntil(this.onDestroy$)
            )
            .subscribe(({ columnNames, rows }) =>
                rows.forEach(rowCells =>
                    rowCells.forEach(cell =>
                        this.renderer.setAttribute(
                            cell,
                            'data-column-name',
                            columnNames[(cell as HTMLTableCellElement).cellIndex]
                        )
                    )
                )
            );
    }

    ngOnDestroy(): void {
        this.theadObserver.disconnect();
        this.tbodyObserver.disconnect();

        this.onDestroy$.next(true);
    }
}
