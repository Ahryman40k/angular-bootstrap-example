/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { IconComponent } from '../icon/icon.component';
import { TagComponent } from '../tag/tag.component';
import { ListDirective, ListItemComponent, ListItemDescriptionDirective, ListItemTitleDirective, NavListDirective } from './list.component';
import { Primary } from './list.component.stories';

const description = `
A list of utility items is a list composed of complex objects intended for an application or a tool.
`;

export default {
  title: 'basic Components / List / Navigation',
  decorators: [
    moduleMetadata({
      // declarations: [BaoListItem],
      imports: [ListItemComponent, TagComponent, IconComponent, NavListDirective, ListItemDescriptionDirective, ListItemTitleDirective, ListDirective]
    })
  ],
  component: ListItemComponent,
  parameters: {
    docs: {
      description: {
        component: description
      }
    }
  },
  argTypes: {}
} as Meta<ListItemComponent>;

export const navigationList: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href="#">Navigation list 1</a>
    <a vdm-list-item href="#">Navigation list 2</a>
  </vdm-nav-list>
  `
});
navigationList.storyName = 'Navigation list';
navigationList.args = {
  ...Primary.args
};

export const navigationListWithLeftIcon: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
    </a>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
    </a>
  </vdm-nav-list>
  `
});
navigationListWithLeftIcon.storyName = 'Navigation list - Left icon';
navigationListWithLeftIcon.args = {
  ...Primary.args
};

export const navigationListWithRightIcon: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
      <span vdm-list-item-title>Title</span>
      <vdm-icon baoIconTag svgIcon="icon-arrow-right"></vdm-icon>
    </a>
    <a vdm-list-item href=#>
      <span vdm-list-item-title>Title</span>
      <vdm-icon baoIconTag svgIcon="icon-arrow-right"></vdm-icon>
    </a>
  </vdm-nav-list>
  `
});
navigationListWithRightIcon.storyName = 'Navigation list - Right icon';
navigationListWithRightIcon.args = {
  ...Primary.args
};

export const navigationListWithTag: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
    <a vdm-list-item href=#>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
  </vdm-nav-list>
  `
});
navigationListWithTag.storyName = 'Navigation list - Tag';
navigationListWithTag.args = {
  ...Primary.args
};

export const navigationListWithTagAndIcon: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
    <a vdm-list-item href=#>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
  </vdm-nav-list>
  `
});
navigationListWithTagAndIcon.storyName = 'Navigation list - Tag & icon';
navigationListWithTagAndIcon.args = {
  ...Primary.args
};

export const navigationListDescription: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </a>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </a>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </a>
  </vdm-nav-list>
  `
});
navigationListDescription.storyName = 'Navigation list - Description';
navigationListDescription.args = {
  ...Primary.args
};

export const navigationListInlineDescription: Story = args => ({
  props: args,
  template: `
  <vdm-nav-list>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
    <a vdm-list-item href=#>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </a>
  </vdm-nav-list>
  `
});
navigationListInlineDescription.storyName =
  'Navigation list - Inline Description';
navigationListInlineDescription.args = {
  ...Primary.args
};
