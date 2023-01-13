import { CommonModule,  } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmButtonModule } from './vdm-button.module';

export default {
  title: 'AGIR / Button',
  component: HTMLButtonElement,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, VdmButtonModule],
    }),
  ],
  argTypes: {
    content: { control: 'text', defaultValue: 'Default' },
    colorScheme: { control: 'select', options: ['primary', 'accent', 'warn'] },
  }
} as Meta<HTMLButtonElement>;

type StyleKind = 'primary' | 'accent' | 'warn';
type ButtonTemplateType = HTMLButtonElement & { content: string; colorScheme: StyleKind };

const ButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, colorScheme, ...props } = args;
  return {
    template: `
        <button vdmButton color="${colorScheme}">
          ${content}
        </button>`,
    props,
  };
};

export const DefaultButton = ButtonTemplate.bind({});
DefaultButton.args = {
  content: 'Default',
  colorScheme: 'primary',
};

const RaisedButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, colorScheme, ...props } = args;
  return {
    template: `
        <button vdmRaised color="${colorScheme}">
          ${content}
        </button>`,
    props,
  };
};

export const DefaultRaisedButton = RaisedButtonTemplate.bind({});
DefaultRaisedButton.args = {
  content: 'Default',
  colorScheme: 'primary',
};

export const AddButton = RaisedButtonTemplate.bind({});
AddButton.args = {
  content: `<span class="icon icon-plus"></span><span>Ajouter</span>`,
  colorScheme: 'primary',
};

export const ViewMapButton = RaisedButtonTemplate.bind({});
ViewMapButton.args = {
  content: `<i class="icon icon-color-secondary icon-map"></i> Voir sur la carte `,
  colorScheme: 'primary',
};

const StrokeButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, colorScheme, ...props } = args;
  return {
    template: `
        <button vdmStroke color="${colorScheme}">
          ${content}
        </button>`,
    props,
  };
};

export const DefaultStrokeButton = StrokeButtonTemplate.bind({});
DefaultStrokeButton.args = {
  content: 'Default',
  colorScheme: 'primary',
} as Partial<ButtonTemplateType>;
