/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { IconComponent } from '../icon/icon.component';
import { TagComponent } from '../tag/tag.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { ListDirective, ListItemComponent, ListItemDescriptionDirective, ListItemTitleDirective, NavListDirective } from './list.component';

const description = `
A list of utility items is a list composed of complex objects intended for an application or a tool.
## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Listes d'objets utilitaires](https://zeroheight.com/575tugn0n/p/658ba3)".
`;

export default {
  title: 'Basic Components / List / Simple list',
  decorators: [
    moduleMetadata({
      // declarations: [BaoListItem],
      imports: [ CheckboxComponent, TagComponent, ListItemComponent, NavListDirective, ListDirective, ListItemDescriptionDirective,  ListItemTitleDirective, IconComponent]
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

const Template: Story<ListItemComponent & { content: string }> = (
  args: ListItemComponent
) => ({
  component: ListItemComponent,
  template: `
    <vdm-list>
      <vdm-list-item>{{content}}</vdm-list-item>
      <vdm-list-item>{{content}}</vdm-list-item>
    </vdm-list>
 `,
  props: args
});

export const Primary = Template.bind({});

Primary.args = {
  content: 'content'
};

export const SimpleListWithLeftIcon: Story = args => ({
  props: args,
  template: `
    <vdm-list>
      <vdm-list-item>
        <vdm-icon vdmIconItemType svgIcon="icon-eye"></vdm-icon>
        <span vdm-list-item-title>Title</span>
      </vdm-list-item>
      <vdm-list-item>
        <vdm-icon vdmIconItemType svgIcon="icon-eye"></vdm-icon>
        <span vdm-list-item-title>Title</span>
      </vdm-list-item>
    </vdm-list>
    `
});
SimpleListWithLeftIcon.storyName = 'Simple list - Left icon';
SimpleListWithLeftIcon.args = {
  ...Primary.args
};

export const SimpleListWithRightIcon: Story = args => ({
  props: args,
  template: `
    <vdm-list>
      <vdm-list-item>
        <span vdm-list-item-title>Title</span>
        <vdm-icon vdmIconTag svgIcon="icon-check"></vdm-icon>
      </vdm-list-item>
      <vdm-list-item>
        <span vdm-list-item-title>Title</span>
        <vdm-icon vdmIconTag svgIcon="icon-check"></vdm-icon>
      </vdm-list-item>
    </vdm-list>
    `
});
SimpleListWithRightIcon.storyName = 'Simple list - Right icon';
SimpleListWithRightIcon.args = {
  ...Primary.args
};

export const SimpleListWithTag: Story = args => ({
  props: args,
  template: `
    <vdm-list>
      <vdm-list-item>
          <span vdm-list-item-title>Title</span>
          <vdm-tag type="positive" variant="light"><span>Label</span></vdm-tag>
      </vdm-list-item>
      <vdm-list-item>
          <span vdm-list-item-title>Title</span>
          <vdm-tag type="positive" variant="strong"><span>Label</span></vdm-tag>
      </vdm-list-item>
    </vdm-list>
    `
});
SimpleListWithTag.storyName = 'Simple list - Tag';
SimpleListWithTag.args = {
  ...Primary.args
};

export const SimpleListWithTagAndIcon: Story = args => ({
  props: args,
  template: `
  <vdm-list>
    <vdm-list-item>
        <vdm-icon vdmIconItemType svgIcon="icon-eye"></vdm-icon>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </vdm-list-item>
    <vdm-list-item>
        <vdm-icon vdmIconItemType svgIcon="icon-eye"></vdm-icon>
        <span vdm-list-item-title>Title</span>
        <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </vdm-list-item>
  </vdm-list>
  `
});
SimpleListWithTagAndIcon.storyName = 'Simple list - Tag & Icon';
SimpleListWithTagAndIcon.args = {
  ...Primary.args
};

export const SimpleListWithDescription: Story = args => ({
  props: args,
  template: `
  <vdm-list>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </vdm-list-item>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </vdm-list-item>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
      <vdm-list-item-description>
        <div>Description 1</div>
        <div>Description 2</div>
      </vdm-list-item-description>
    </vdm-list-item>
  </vdm-list>
  `
});
SimpleListWithDescription.storyName = 'Simple list - Description';
SimpleListWithDescription.args = {
  ...Primary.args
};

export const SimpleListWithInlineDescription: Story = args => ({
  props: args,
  template: `
  <vdm-list>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </vdm-list-item>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </vdm-list-item>
    <vdm-list-item>
      <vdm-icon baoIconItemType svgIcon="icon-eye"></vdm-icon>
      <span vdm-list-item-title>Title</span>
      <ul vdm-list-item-description>
        <li>Description 1</li>
        <li>Description 2</li>
      </ul>
      <vdm-tag type="positive"><span>Label</span></vdm-tag>
    </vdm-list-item>
  </vdm-list>
  `
});
SimpleListWithInlineDescription.storyName = 'Simple list - Inline Description';
SimpleListWithInlineDescription.args = {
  ...Primary.args
};
