/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';

import { AvatarComponent, AvatarContentDirective } from './avatar.component'

const description = `
Avatar are used to display a representation of a user's profile. 

## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Avatar](https://zeroheight.com/575tugn0n/p/34e9ae)".
`;

export default {
  title: 'Basic Components / Avatar',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, AvatarComponent, AvatarContentDirective]
    })
  ],
  component: AvatarComponent,
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
    },
    addIcon: {
      table: {
        disable: true
      }
    },
    formatInitials: {
      table: {
        disable: true
      }
    },
    setProfileName: {
      table: {
        disable: true
      }
    }
  }
} as Meta<AvatarComponent>;

const Template: Story<AvatarComponent> = (args) => ({
  template: `
    <vdm-avatar [color]="color" [profileName]="profileName">
      <span vdm-avatar-content>aa</span>
    </vdm-avatar>
   `,
  props: args
});

export const Primary = Template.bind({});

Primary.args = {
  color: 'background-color-1',
  profileName: 'Jean Tremblay'
};

export const AvatarDefault: Story<AvatarComponent> = args => ({
  props: args,
  template: `
      <vdm-avatar [profileName]="profileName"></vdm-avatar>
      `
});
AvatarDefault.storyName = 'Avatar with icon - Default';
AvatarDefault.args = {
  ...Primary.args
};

export const AvatarWithImage: Story<AvatarComponent> = args => ({
  props: args,
  template: `
      <vdm-avatar [profileName]="profileName">
        <img vdm-avatar-content src="https://picsum.photos/768/768?image=1074">
      </vdm-avatar>
      `
});
AvatarWithImage.storyName = 'Avatar with image';
AvatarWithImage.args = {
  ...Primary.args
};
