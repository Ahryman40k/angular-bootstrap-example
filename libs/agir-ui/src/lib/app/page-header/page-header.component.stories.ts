/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';
import { ButtonComponent } from '../../basic/button/button.component';
import { IconComponent } from '../../basic/icon/icon.component';

const description = `
AGIR component displayed in top of planification pages. 
It's composed of a title and an action section
`;


const basicComponents = [ ButtonComponent, IconComponent]

export default {
  title: 'AGIR components / Page-Header',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ...basicComponents,  PageHeaderComponent]
    })
  ],
  component: PageHeaderComponent,
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
} as Meta<PageHeaderComponent>;

const Template: Story<PageHeaderComponent > = (
  args: PageHeaderComponent
) => ({
  template: `
  <agir-page-header title="Sample Header">
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-plus"></vdm-icon><span>Action 1</span></button>
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-minus"></vdm-icon><span>Action 2</span></button>
  </agir-page-header>
  <agir-page-header title="Programmation annuelle">
    <button vdm-button type="button" displayType="utility" level="primary" size="medium" style="margin-right: 1rem;"><vdm-icon svgIcon="icon-plus"></vdm-icon><span>Ajouter</span></button>
  </agir-page-header>`,
  props: args
});

export const Primary = Template.bind({});

Primary.args = {
 
};
