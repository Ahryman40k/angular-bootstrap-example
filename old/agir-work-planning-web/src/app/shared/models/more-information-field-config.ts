import { FormControl } from '@angular/forms';

export interface IMoreInformationFieldConfig {
  control: FormControl;
  saveAction: () => Promise<boolean>;
  cancel: () => void;
}
