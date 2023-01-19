import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { BoroughCode, ITaxonomyList, ProjectType } from '@villemontreal/agir-work-planning-lib';
import { endsWith, find, flatten, isNil } from 'lodash';

import { IGlobalFavorite } from '../models/favorite/global-favorite';

export class CustomValidators {
  /**
   * Creates a range validator.
   * @param from The key of the form control that holds the 'from' value.
   * @param to The key of the form control that holds the 'to' value.
   * @param [error] The key of the final error. (Default value = 'range')
   * @returns  A validator.
   */
  public static formRange(from: string, to: string, error = 'range'): (fg: FormGroup) => {} {
    return (fg: FormGroup) => {
      const start = fg.get(from).value;
      const end = fg.get(to).value;
      if (!start || !end || +start <= +end) {
        return null;
      }
      const e = {};
      e[error] = true;
      return e;
    };
  }

  public static submissionNumbers(submissionNumber: string, error = 'submissionNumbersFormat'): (fg: FormGroup) => {} {
    return (fg: FormGroup) => {
      let submissionNumberValue = fg.get(submissionNumber).value;
      if (!submissionNumberValue || submissionNumberValue.length < 1) {
        return null;
      }
      submissionNumberValue = submissionNumberValue.replace(/\s/g, '');
      const submissionNumberArray = submissionNumberValue.split(',');
      const filtered = submissionNumberArray.filter(el => el.length !== 6 || isNaN(parseInt(el, 10)));
      if (filtered.length > 0) {
        const e = {};
        e[error] = true;
        return e;
      }
      return null;
    };
  }

  public static min(min: number): (fc: FormControl) => { minimum: { minimum: number; actual: number } } {
    return (fc: FormControl) => {
      let v: number;
      if (fc.value instanceof Array) {
        v = fc.value.length;
      } else {
        // tslint:disable-next-line: radix
        v = parseInt(fc.value);
      }
      return isNaN(v) || min <= v
        ? null
        : {
            minimum: {
              minimum: min,
              actual: v
            }
          };
    };
  }

  public static fileType(...fileTypes: string[]): (fc: FormControl) => { fileType: boolean } {
    return (fc: FormControl) => {
      const file = fc.value as File;
      if (!file || !file.name) {
        return null;
      }
      return fileTypes.some(x => endsWith(file.name.toLowerCase(), x)) ? null : { fileType: true };
    };
  }

  public static boroughs(): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      const boroughs = fc.value as string[];
      if (!boroughs?.length) {
        return null;
      }
      return boroughs.length > 1 && find(boroughs, b => b === BoroughCode.MTL) ? { invalidBoroughs: true } : null;
    };
  }

  /**
   * Checks if the user's favorites contains the sent favorite name
   * @param favorites the user's existing favorites
   * @returns either an object saying the favorite is a duplicate or null
   */
  public static favoritesDuplicate(favorites: IGlobalFavorite[]): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      if (!favorites?.length) {
        return null;
      }
      const favoritesNames = favorites.map(f => f.name?.toUpperCase());
      const favoriteName: string = fc.value;
      if (favoritesNames?.includes(favoriteName?.toUpperCase())) {
        return { isFavoriteDuplicate: true };
      }
      return null;
    };
  }

  /**
   * Checks if the taxonomies contain the sent nexo code
   * @param taxonomies
   * @returns either an object saying the nexo code is a duplicate or null
   */
  public static nexoCodeDuplicate(taxonomies: ITaxonomyList): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      if (!taxonomies?.length) {
        return null;
      }
      const arrays = taxonomies.map(t => t.properties?.nexoMatches?.map(m => m.code.toUpperCase()));
      const codes = flatten(arrays);
      const nexoCode: string = fc.value;
      if (codes?.includes(nexoCode?.toUpperCase())) {
        return { isNexoCodeDuplicate: true };
      }
      return null;
    };
  }

  /**
   * Checks if the taxonomies contain the sent code
   * @param taxonomies
   * @returns either an object saying the code is a duplicate or null
   */
  public static codeDuplicate(taxonomies: ITaxonomyList): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      if (!taxonomies?.length) {
        return null;
      }
      const codes = taxonomies.map(t => t.code.toUpperCase());
      const code: string = fc.value;
      if (codes?.includes(code?.toUpperCase())) {
        return { isCodeDuplicate: true };
      }
      return null;
    };
  }

  /**
   * Checks if the program book's project types contains non integrated and an other type
   * @returns either an object saying the project types are invalid or null
   */
  public static programBookProjectTypes(): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      const projectTypes = fc.value as string[];
      if (!projectTypes?.length) {
        return null;
      }
      if (projectTypes.includes(ProjectType.nonIntegrated) && projectTypes.length > 1) {
        return { projectTypesInvalid: true };
      }
      return null;
    };
  }

  public static fileMaxSizeMo(maxSizeMo: number): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      if (!fc.value) {
        return null;
      }
      const maxSizeByte = maxSizeMo * 1000000;
      if (fc.value instanceof File && fc.value.size > maxSizeByte) {
        return { fileMaxSizeMo: { max: maxSizeMo, actual: fc.value.size } };
      }
      return null;
    };
  }

  public static get infoRtuNumber(): ValidatorFn {
    return Validators.pattern('[a-zA-Z0-9.-]*');
  }

  public static fromDateSequence(fromDateId: string, toDateId: string): ValidatorFn {
    return (fc: FormControl): { [key: string]: any } | null => {
      const fDate = fc.parent.get(fromDateId)?.value;
      const tDate = fc.parent.get(toDateId)?.value;
      if (!isNil(fDate) && !isNil(tDate) && fDate > tDate) {
        return { isFromToDateSeqenceInvalid: true };
      }
      return null;
    };
  }
}
