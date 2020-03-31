import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Hero, HeroService } from '../../services/hero.service';
import {
    map,
    withLatestFrom,
    debounce,
    debounceTime,
    tap,
} from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'rx-hero-table',
    template: `
        <ng-container *ngIf="vm$ | async as vm">
            <h4 *ngIf="vm.loading">Loading..</h4>
            <div class="tool-bar">
                <span class="search-tool">
                    <label for="herosearch">Search: </label>
                    <input
                        type="text"
                        name="herosearch"
                        [value]="vm.search"
                        (input)="setSearch($event.target.value)"
                    />
                </span>
                <span class="page-tool">
                    <label
                        >Page {{ vm.userPage }} of {{ vm.totalPages }} :
                    </label>
                    <span class="buttons">
                        <button
                            class="prev"
                            [disabled]="vm.userPage === 1"
                            (click)="movePage(-1)"
                        >
                            Prev
                        </button>
                        <button
                            class="next"
                            [disabled]="vm.isLastPage"
                            (click)="movePage(1)"
                        >
                            Next
                        </button>
                    </span>
                </span>
                <span class="result-tool">
                    <label>Show Results: </label>
                    <span class="buttons">
                        <button
                            *ngFor="let limit of hero.limits"
                            [disabled]="vm.limit == limit"
                            (click)="setLimit(limit)"
                        >
                            {{ limit }}
                        </button>
                    </span>
                </span>
                <span class="total-tool">
                    <label>Total Results: {{ vm.totalHeroes }}</label>
                </span>
            </div>
            <div class="table-content">
                <rx-hero-badge
                    *ngFor="let hero of vm.heroes"
                    [hero]="hero"
                ></rx-hero-badge>
            </div>
        </ng-container>
    `,
    styleUrls: ['./hero-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroTableComponent implements OnInit {
    // userPage$ = this.hero.pageBS.pipe(map(page => page + 1));
    // isLastPage$ = this.userPage$.pipe(
    //     withLatestFrom(this.hero.totalPages$),
    //     map(([userPage, totalPage]) => userPage === totalPage),
    // );

    vm$ = combineLatest([
        this.hero.heroes$,
        this.hero.loading$,
        this.hero.totalHeroes$,
        this.hero.totalPages$,
    ]).pipe(
        withLatestFrom(this.hero.search$, this.hero.page$, this.hero.limit$),
        debounceTime(0),
        map(
            ([
                [heroes, totalHeroes, totalPages, loading],
                search,
                page,
                limit,
            ]) => ({
                limit,
                search,
                heroes,
                totalHeroes,
                totalPages,
                page,
                loading,
                userPage: page + 1,
                isLastPage: page + 1 === totalPages,
            }),
        ),
    );
    constructor(public hero: HeroService) {}

    ngOnInit() {}
    setLimit(limit: number) {
        this.hero.setLimit(limit);
    }
    setSearch(text: string) {
        this.hero.setSearch(text);
    }

    movePage(index: number) {
        this.hero.movePageby(index);
    }
}
