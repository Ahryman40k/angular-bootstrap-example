/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { ReactiveFormsModule } from '@angular/forms';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { CheckboxComponent, CheckBoxDescriptionDirective } from './checkbox.component';
import { CheckboxGroupComponent } from './checkbox-group.component';

const description = `
## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Case à cocher](https://zeroheight.com/575tugn0n/p/99cd94)".
`;

export default {
  title: 'Basic Components/Checkbox',
  decorators: [
    moduleMetadata({
      
      imports: [ReactiveFormsModule, CheckBoxDescriptionDirective, CheckboxGroupComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  component: CheckboxComponent,
  argTypes: {},
} as Meta<CheckboxComponent>;

const Template: Story<CheckboxComponent & { label: string }> = () => ({
  template: `
  <vdm-checkbox id="ID1" name="name"
  [disabled]="disabled"
  [checked]="checked"
  [hiddenLabel]="hiddenLabel"
  [indeterminate]="indeterminate"
  [inline]="inline"
  [required]="required"
  >
    {{label}}
  </vdm-checkbox>
 `,
});

export const Primary = Template.bind({});

Primary.args = {
  label: 'Label',
};

export const CheckboxSimple: Story = (args) => ({
  props: args,
  template: `
  <vdm-checkbox-group>
    <legend required="true" vdm-label>Liste d'options</legend>
    <vdm-checkbox id="ID11111222" name="name">
      Label
    </vdm-checkbox>
    <vdm-checkbox id="ID22222211" name="name2" [checked]="true">
      Label (checked)
    </vdm-checkbox>
    <vdm-checkbox id="ID33333222" name="name3" [indeterminate]="true">
      Label (indeterminate)
    </vdm-checkbox>
    <vdm-checkbox id="ID4444443333" name="name4" [disabled]="true">
      Label (disabled)
    </vdm-checkbox>
  </vdm-checkbox-group>
  `,
});
CheckboxSimple.storyName = 'Checkbox - Simple';
CheckboxSimple.args = {
  ...Primary.args,
};

export const InlineCheckboxWithGuidingText: Story = (args) => ({
  props: args,
  template: `
  <vdm-checkbox-group>
    <legend required="true" vdm-label>Liste d'options avec texte d'assistance</legend>
    <vdm-checkbox id="ID121121" name="name11210" inline="true">
      Label
    </vdm-checkbox>
    <vdm-checkbox id="ID2222221" name="name2222" checked="true" inline="true">
      Label (checked)
    </vdm-checkbox>
    <vdm-checkbox id="ID312121" name="name313" indeterminate="true" inline="true">
      Label (indeterminate)
    </vdm-checkbox>
    <vdm-checkbox id="ID433334" name="name4314" disabled="true" inline="true">
      Label (disabled)
    </vdm-checkbox>
    <vdm-guiding-text>Texte d'assistance pour le groupe</vdm-guiding-text>
  </vdm-checkbox-group>
  `,
});
InlineCheckboxWithGuidingText.storyName = 'Inline checkbox with guiding text';
InlineCheckboxWithGuidingText.args = {
  ...Primary.args,
};

export const CheckboxDescriptionError: Story = (args) => ({
  props: args,
  template: `
  <vdm-checkbox-group>
    <legend required="true" vdm-label>Liste d'options avec erreur</legend>
    <vdm-checkbox id="ID1111111111" name="name11111" brandBorder="true">
      Label
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID2222222" name="name2222" brandBorder="true" checked="true">
      Label (checked)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID3333333" name="name3333" brandBorder="true" indeterminate="true">
      Label (indeterminate)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID44444444" name="name44444" brandBorder="true" disabled="true">
      Label (disabled)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-error>Erreur pour le groupe</vdm-error>
  </vdm-checkbox-group>
  `,
});
CheckboxDescriptionError.storyName = 'Checkbox - Description & error';
CheckboxDescriptionError.args = {
  ...Primary.args,
};

export const CheckboxDescriptionHiddenLabel: Story = (args) => ({
  props: args,
  template: `
  <vdm-checkbox-group>
    <legend required="true" vdm-label>Liste d'options avec l'étiquette invisble</legend>
    <vdm-checkbox id="ID11" name="name1" brandBorder="true" hiddenLabel="true">
      Label
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID22" name="name2" brandBorder="true" checked="true" hiddenLabel="true">
      Label (checked)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID33" name="name3" brandBorder="true" indeterminate="true" hiddenLabel="true">
      Label (indeterminate)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
    <vdm-checkbox id="ID44" name="name4" brandBorder="true" disabled="true" hiddenLabel="true">
      Label (disabled)
      <vdm-checkbox-description>Est est et dolores dolore sed justo ipsum et sit.</vdm-checkbox-description>
    </vdm-checkbox>
  </vdm-checkbox-group>
  `,
});
CheckboxDescriptionHiddenLabel.storyName = 'Checkbox - Description & hidden label';
CheckboxDescriptionHiddenLabel.args = {
  ...Primary.args,
};

export const CheckboxExample: Story = (args) => ({
  props: args,
  template: `
    <vdm-checkbox-example></vdm-checkbox-example>
  `,
});
CheckboxExample.storyName = 'Basic example';
CheckboxExample.args = {
  ...Primary.args,
};

export const CheckboxReactiveExample: Story = (args) => ({
  props: args,
  template: `
    <vdm-checkbox-reactive-form-example></vdm-checkbox-reactive-form-example>
  `,
});
CheckboxReactiveExample.storyName = 'Checkbox - Reactive form example';
CheckboxReactiveExample.args = {
  ...Primary.args,
};
