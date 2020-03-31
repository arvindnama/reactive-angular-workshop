import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import {
    map,
    flatMap,
    switchMap,
    debounceTime,
    pluck,
    catchError,
    withLatestFrom,
    tap,
    distinctUntilChanged,
    shareReplay,
} from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

interface HeroState {
    search: string;
    page: number;
    limit: number;
    loading: boolean;
}
const initialState: HeroState = {
    search: '',
    page: 0,
    limit: LIMIT_LOW,
    loading: false,
};

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    heroState$ = new BehaviorSubject<HeroState>(initialState);

    // private searchBS = new BehaviorSubject('iron');
    // private pageBS = new BehaviorSubject(0);
    // private limitBS = new BehaviorSubject(LIMIT_LOW);
    // private loadingBS = new BehaviorSubject(false);

    search$ = this.heroState$.pipe(
        pluck('search'),
        distinctUntilChanged(),
    );
    page$ = this.heroState$.pipe(
        pluck('page'),
        distinctUntilChanged(),
    );
    limit$ = this.heroState$.pipe(
        pluck('limit'),
        distinctUntilChanged(),
    );
    loading$ = this.heroState$.pipe(
        pluck('loading'),
        distinctUntilChanged(),
    );

    params$ = combineLatest([this.search$, this.page$, this.limit$]).pipe(
        debounceTime(500),
    );
    heroesResponse$ = this.params$.pipe(
        tap(() =>
            this.heroState$.next({
                ...this.heroState$.getValue(),
                loading: true,
            }),
        ),
        switchMap(([search, page, limit]) => {
            const params: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`, // page * limit
            };
            if (search) {
                params.nameStartsWith = search;
            }
            return this.http
                .get(HERO_API, {
                    params,
                })
                .pipe(catchError(err => []));
        }),
        tap(() =>
            this.heroState$.next({
                ...this.heroState$.getValue(),
                loading: false,
            }),
        ),
        /**
         * shared Replay:: shared the same observable instead of recreating one.
         */
        shareReplay(1),
    );

    heroes$ = this.heroesResponse$.pipe(map((res: any) => res.data.results));
    totalHeroes$ = this.heroesResponse$.pipe(pluck('data', 'total'));
    // totalPages$ = combineLatest([this.limitBS, this.totalHeroes$]).pipe(
    //     map(([limit, total]) => Math.ceil(total / limit)),
    // );
    totalPages$ = this.totalHeroes$.pipe(
        withLatestFrom(this.heroState$),
        map(([total, { limit }]) => Math.ceil(total / limit)),
    );

    constructor(private http: HttpClient) {}

    movePageby(index: number) {
        const state = this.heroState$.getValue();
        this.heroState$.next({
            ...state,
            page: state.page + index,
        });
    }
    setSearch(text: string) {
        const curState = this.heroState$.getValue();
        this.heroState$.next({
            ...curState,
            search: text,
            page: 0,
        });
    }
    setLimit(limit: number) {
        const curState = this.heroState$.getValue();
        this.heroState$.next({
            ...curState,
            limit: limit,
            page: 0,
        });
    }
}
