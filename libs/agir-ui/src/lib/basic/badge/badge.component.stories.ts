import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { ButtonComponent } from '../button/button.component';

import { BadgeComponent } from './badge.component';

const description = `
`;

export default {
  title: 'Basic Components / Badge',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, BadgeComponent, ButtonComponent],
    }),
  ],
  component: BadgeComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    ngOnChanges: {
      table: {
        disable: true,
      },
    },
    type: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<BadgeComponent>;

const Template: Story<BadgeComponent & { title: string; content: string }> = (args) => ({
  template: `
  <div>
    <vdm-badge type="success">
        badge
    </vdm-badge>
  </div>
 `,
  props: args,
});

export const Primary = Template.bind({});
