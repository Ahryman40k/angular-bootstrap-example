import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appIsIncluded'
})
export class IsIncludedPipe implements PipeTransform {
  public transform(items: any[], itemList: any[]): boolean {
    return itemList.some(i => this.mapToId(items).includes(i));
  }

  public mapToId(items: any[]): string[] {
    return items?.map(i => i.id);
  }
}
