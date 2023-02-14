/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from './button.component';

const description = `
Primary UI component for user interaction
## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Bouton](https://zeroheight.com/575tugn0n/p/466f23)".
`;

export default {
  title: 'Basic components / Button',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ButtonComponent, IconComponent]
    })
  ],
  component: ButtonComponent,
  parameters: {
    docs: {
      description: {
        component: description
      }
    }
  },
  argTypes: {
    ngAfterViewInit: {
      table: {
        disable: true
      }
    }
  }
} as Meta<ButtonComponent>;

const Template: Story<ButtonComponent & { label: string }> = (
  args: ButtonComponent
) => ({
  component: ButtonComponent,
  template: `
  <button
    vdm-button
    type="button"
    [reversed]="reversed"
    [fullWidth]="fullWidth"
    [displayType]="displayType"
    [loading]="loading"
    [size]="size"
    [level]="level"
    [loadingSpinnerAriaLabel]="loadingSpinnerAriaLabel"
    style="margin-right: 1rem;">
    {{label}}
  </button>`,
  props: args
});

export const Primary = Template.bind({});

Primary.args = {
  rightIcon: false,
  noText: false,
  loading: false,
  reversed: false,
  fullWidth: false,
  displayType: 'utility',
  label: 'Button',
  level: 'primary',
  size: 'medium'
};

export const UtilitySizeButton: Story = args => ({
  props: args,
  template: `
  <div>
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="medium" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="medium">Label</button>
  </div>
  <div style="margin-top:1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" size="small" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="small" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="small">{{label}}</button>
  </div>
  `
});
UtilitySizeButton.storyName = 'Utility - Sizes';
UtilitySizeButton.args = {
  ...Primary.args
};

export const UtilityIconsButton: Story = args => ({
  props: args,
  template: `
  <div style="">
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
  </div>
  <div style="margin-top: 1rem">
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="medium" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="medium" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
  </div>
  <div style="margin-top: 1rem">
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" aria-label="help" style="margin-right: 1rem;"><vdm-icon title="help" svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="medium" aria-label="help" style="margin-right: 1rem;"><vdm-icon title="help" svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="medium" aria-label="help" style="margin-right: 1rem;"><vdm-icon title="help" svgIcon="icon-help"></vdm-icon></button>
  </div>
  <div style="margin-top: 1rem">
    <button vdm-button type="button" displayType="utility" level="primary" size="small" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="small" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="small" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon><span>{{label}}</span></button>
  </div>
  <div style="margin-top: 1rem">
    <button vdm-button type="button" displayType="utility" level="primary" size="small" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="small" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="small" style="margin-right: 1rem;"><span>{{label}}</span><vdm-icon svgIcon="icon-help"></vdm-icon></button>
  </div>
  `
});
UtilityIconsButton.storyName = 'Utility - Icons';
UtilityIconsButton.args = {
  ...Primary.args
};

export const UtilityLevelButton: Story = args => ({
  props: args,
  template: `
    <button vdm-button type="button" displayType="utility" level="primary" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary">{{label}}</button>
  `
});
UtilityLevelButton.storyName = 'Utility - Level';
UtilityLevelButton.args = {
  ...Primary.args
};

export const UtilityDisabledButton: Story = args => ({
  props: args,
  template: `
  <div>
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="medium" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="medium" disabled>Label</button>
  </div>
  <div style="margin-top: 1rem">
    <button vdm-button type="button" displayType="utility" level="primary" size="small" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="small" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="small" disabled>{{label}}</button>
  </div>
  `
});
UtilityDisabledButton.storyName = 'Utility - Disabled';
UtilityDisabledButton.args = {
  ...Primary.args
};

export const UtilityReversedButton: Story = args => ({
  props: args,
  template: `
  <div style="background-color: black; padding: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" [reversed]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" [reversed]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [reversed]="true">{{label}}</button>
  </div>
  `
});
UtilityReversedButton.storyName = 'Utility - Reversed';
UtilityReversedButton.args = {
  ...Primary.args
};

export const UtilityRDButton: Story = args => ({
  props: args,
  template: `
  <div style="background-color: black; padding: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" [reversed]="true" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" [reversed]="true" disabled style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [reversed]="true" disabled>{{label}}</button>
  </div>
  `
});
UtilityRDButton.storyName = 'Utility - Reversed and Disabled';
UtilityRDButton.args = {
  ...Primary.args
};

export const UtilityLoadingButton: Story = args => ({
  props: args,
  template: `
  <div>
    <button vdm-button type="button" displayType="utility" level="primary" [loading]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" [loading]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [loading]="true" >{{label}}</button>
  </div>
  <div style="margin-top: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" [loading]="true" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon>{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" [loading]="true" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon>{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [loading]="true"><vdm-icon svgIcon="icon-help"></vdm-icon>{{label}}</button>
  </div>
  <div style="margin-top: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" [loading]="true" style="margin-right: 1rem;">{{label}}<vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="secondary" [loading]="true" style="margin-right: 1rem;">{{label}}<vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [loading]="true">{{label}}<vdm-icon svgIcon="icon-help"></vdm-icon></button>
  </div>
  <div style="margin-top: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" [loading]="true" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="secondary" [loading]="true" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-help"></vdm-icon></button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [loading]="true"><vdm-icon svgIcon="icon-help"></vdm-icon></button>
  </div>
  <div style="margin-top: 1rem;">
    <button vdm-button type="button" displayType="utility" level="primary" size="small" [loading]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" size="small"  [loading]="true" style="margin-right: 1rem;">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" size="small"  [loading]="true" >{{label}}</button>
  </div>
  `
});
UtilityLoadingButton.storyName = 'Utility - Loading';
UtilityLoadingButton.parameters = {
  docs: {
    description: {
      story:
        "If the input `loading` is set to `true`, the button will be disabled and a loading spinner will appear. The spinner will appear in place of the icon in the button if there is one or to the left of the button's text."
    }
  }
};
UtilityLoadingButton.args = {
  ...Primary.args
};

export const UtilityFullWidthButton: Story = args => ({
  props: args,
  template: `
    <div>
    <button vdm-button type="button" displayType="utility" level="primary" [fullWidth]="true">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="secondary" [fullWidth]="true">{{label}}</button>
    <button vdm-button type="button" displayType="utility" level="tertiary" [fullWidth]="true">{{label}}</button>
  </div>
  `
});
UtilityFullWidthButton.storyName = 'Utility - Full width';
UtilityFullWidthButton.parameters = {
  docs: {
    description: {
      story:
        "If the input `fullWidth` is set to `true`, the button will grow to the width of it's container"
    }
  }
};
UtilityFullWidthButton.args = {
  ...Primary.args
};
