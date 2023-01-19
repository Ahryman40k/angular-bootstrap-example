import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Subject } from 'rxjs';

export class BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  public TaxonomyGroup = TaxonomyGroup;
  public Permission = Permission;

  private readonly onInitSubject = new Subject();
  public readonly onInit$ = this.onInitSubject.asObservable();

  private readonly afterViewInitSubject = new Subject();
  public readonly afterViewInit$ = this.afterViewInitSubject.asObservable();

  protected destroySubject = new Subject();
  public readonly destroy$ = this.destroySubject.asObservable();

  public ngOnInit(): void {
    this.onInitSubject.next();
  }

  public ngAfterViewInit(): void {
    this.afterViewInitSubject.next();
  }

  public ngOnDestroy(): void {
    this.destroySubject.next();
  }
}
