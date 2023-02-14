/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

import {
  AlertActionsDirective,
  AlertComponent,
  AlertContentDirective,
  AlertLinkDirective,
  AlertTitleDirective,
} from './alert.component';

const description = `
Alerts are used to display an important message and optional related **actions**.

## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Message ciblé](https://zeroheight.com/575tugn0n/p/929c63)".

## Colors and icons
To modify the color (and icon) of an alert, the \`type\` input property must be used.

* \`success\` for a positive alert
* \`danger\` for a negative alert
* \`warning\` for a warning alert
* \`info\` for an informational alert
* \`emergency\` for emergency alert

`;

export default {
  title: 'Basic Components / Alert',
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        IconComponent,
        ButtonComponent,
        AlertActionsDirective,
        AlertComponent,
        AlertContentDirective,
        AlertLinkDirective,
        AlertTitleDirective,
      ],
    }),
  ],
  component: AlertComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    alertTitleIcon: {
      table: {
        disable: true,
      },
    },
    alertTypeIcon: {
      table: {
        disable: true,
      },
    },
    ngOnChanges: {
      table: {
        disable: true,
      },
    },
    iconTitle: {
      table: {
        disable: true,
      },
    },
    iconType: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<AlertComponent>;

const Template: Story<AlertComponent & { title: string; content: string }> = (args) => ({
  template: `
  <vdm-alert [type]="type" [dismissible]="dismissible">
    <vdm-alert-title>{{title}}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
 `,
  props: args,
});

export const Primary = Template.bind({});

Primary.args = {
  type: 'info',
  dismissible: false,
  title: "The alert's title",
  content: 'Alert message with <a href="#" vdm-alert-link>an optional link</a> if needed.',
};

export const DismissableAlert: Story = (args) => ({
  props: args,
  template: `
  <vdm-alert type="success" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="danger" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="warning" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="info" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="emergency" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  `,
});

const dismissableStoryDescription = `
Setting the \`dismissible\` input to \`true\` will add a dismiss button to the top right of the alert. Clicking on the button will result in the
the component emitting a \`dismiss\` event that the parent component will be able to handle.`;

DismissableAlert.storyName = 'Dismissible alerts';
DismissableAlert.parameters = {
  docs: {
    description: {
      story: dismissableStoryDescription,
    },
  },
};
DismissableAlert.args = {
  ...Primary.args,
  dismissible: true,
};

export const DismissableWithActionsAlert: Story = (args) => ({
  props: args,
  template: `
  <vdm-alert type="success" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
    <vdm-alert-actions>
    <button vdm-button role="button" type="utility" level="primary">Label</button>
    <button vdm-button role="button" type="utility" level="secondary">Label</button>
    <button vdm-button role="button" type="utility" level="tertiary">Label</button>
  </vdm-alert-actions>
  </vdm-alert>
  <vdm-alert type="danger" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
    <vdm-alert-actions>
    <button vdm-button role="button" type="utility" level="primary">Label</button>
    <button vdm-button role="button" type="utility" level="secondary">Label</button>
    <button vdm-button role="button" type="utility" level="tertiary">Label</button>
  </vdm-alert-actions>
  </vdm-alert>
  <vdm-alert type="warning" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
    <vdm-alert-actions>
    <button vdm-button role="button" type="utility" level="primary">Label</button>
    <button vdm-button role="button" type="utility" level="secondary">Label</button>
    <button vdm-button role="button" type="utility" level="tertiary">Label</button>
  </vdm-alert-actions>
  </vdm-alert>
  <vdm-alert type="info" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
    <vdm-alert-actions>
    <button vdm-button role="button" type="utility" level="primary">Label</button>
    <button vdm-button role="button" type="utility" level="secondary">Label</button>
    <button vdm-button role="button" type="utility" level="tertiary">Label</button>
  </vdm-alert-actions>
  </vdm-alert>
  <vdm-alert type="emergency" [dismissible]="dismissible">
    <vdm-alert-title>{{ title }}</vdm-alert-title>
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
    <vdm-alert-actions>
    <button vdm-button role="button" type="utility" level="primary">Label</button>
    <button vdm-button role="button" type="utility" level="secondary">Label</button>
    <button vdm-button role="button" type="utility" level="tertiary">Label</button>
  </vdm-alert-actions>
  </vdm-alert>
  `,
});

DismissableWithActionsAlert.storyName = 'Alerts with actions';

DismissableWithActionsAlert.args = {
  ...Primary.args,
  dismissible: true,
};

export const DismissableWithoutTitleAlert: Story = (args) => ({
  props: args,
  template: `
  <vdm-alert type="success" [dismissible]="dismissible">
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="danger" [dismissible]="dismissible">
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="warning" [dismissible]="dismissible">
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="info" [dismissible]="dismissible">
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  <vdm-alert type="emergency" [dismissible]="dismissible">
    <vdm-alert-content [innerHTML]="content"></vdm-alert-content>
  </vdm-alert>
  `,
});

DismissableWithoutTitleAlert.storyName = 'Alerts without title';

DismissableWithoutTitleAlert.args = {
  ...Primary.args,
  dismissible: true,
};
