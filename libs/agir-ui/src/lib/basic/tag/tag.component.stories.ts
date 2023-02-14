/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { IconComponent } from '../icon/icon.component';
import { TagComponent } from './tag.component';

const description = `
 Tags are used to categorize, identify and organize content.
 ## Documentation
 The full documentation of this component is available in the Hochelaga design system documentation under "[Étiquette](https://zeroheight.com/575tugn0n/p/8594a9)".
 `;

export default {
  title: 'Basic Components / Tag',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, IconComponent, TagComponent],
    }),
  ],
  component: TagComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    addHiddenText: {
      table: {
        disable: true,
      },
    },
    addIconClass: {
      table: {
        disable: true,
      },
    },
    ngAfterViewInit: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<TagComponent>;

const Template: Story<TagComponent & { label: string }> = (args: TagComponent) => ({
  component: TagComponent,
  template: `
   <vdm-tag [type]="type" [hiddenText]="hiddenText" [variant]="variant" style="margin-right:1.5rem">
    <span>{{label}}</span>
   </vdm-tag>
  `,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  label: 'Label',
  type: 'neutral',
  variant: 'light',
};

export const StrongTag: Story = (args) => ({
  props: args,
  template: `
   <vdm-tag type="positive" variant="strong" style="margin-right:1.5rem"><span>{{label}}</span></vdm-tag>
   <vdm-tag type="negative" variant="strong" style="margin-right:1.5rem"><span>{{label}}</span></vdm-tag>
   <vdm-tag variant="strong" style="margin-right:1.5rem"><span>{{label}}</span></vdm-tag>
   <vdm-tag type="alert" variant="strong" style="margin-right:1.5rem"><span>{{label}}</span></vdm-tag>
   <vdm-tag type="info" variant="strong" style="margin-right:1.5rem"><span>{{label}}</span></vdm-tag>
   `,
});

StrongTag.storyName = 'Tags - Strong';
StrongTag.args = {
  ...Primary.args,
};

export const IconTag: Story = (args) => ({
  props: args,
  template: `
   <vdm-tag type="positive" variant="strong" style="margin-right:1.5rem"><vdm-icon svgIcon="icon-check-circle"></vdm-icon><span>{{label}}</span></vdm-tag>
   <vdm-tag type="negative" style="margin-right:1.5rem"><vdm-icon svgIcon="icon-minus-circle"></vdm-icon><span>{{label}}</span></vdm-tag>
   <vdm-tag hiddenText="Neutre" style="margin-right:1.5rem"><vdm-icon svgIcon="icon-bell"></vdm-icon><span>{{label}}</span></vdm-tag>
   <vdm-tag type="alert" variant="strong" style="margin-right:1.5rem"><vdm-icon svgIcon="icon-warning"></vdm-icon><span>{{label}}</span></vdm-tag>
   <vdm-tag type="info" variant="light" style="margin-right:1.5rem"><vdm-icon svgIcon="icon-info"></vdm-icon><span>{{label}}</span></vdm-tag>
   `,
});

IconTag.storyName = 'Tags - Icon';
IconTag.args = {
  ...Primary.args,
};
