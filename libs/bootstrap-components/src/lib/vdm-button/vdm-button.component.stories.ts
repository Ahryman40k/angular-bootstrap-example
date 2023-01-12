import { CommonModule } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmButtonModule } from '../vdm-button/vdm-button.module';

export default {
  title: 'AGIR / Button',
  component: HTMLButtonElement,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, VdmButtonModule],
    })
  ]
} as Meta<HTMLButtonElement>;


type ButtonTemplateType =  HTMLButtonElement & { content: string }

const ButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <button vdmButton>
          ${content}
        </button>`,
    props,
  };
}
ButtonTemplate.argTypes = {
  content: { control: 'text', defaultValue: 'Default'}
}

export const DefaultButton = ButtonTemplate.bind({});
DefaultButton.args = {
  content: 'Default'
}



const RaisedButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <button vdmRaised>
          ${content}
        </button>`,
    props,
  };
}
RaisedButtonTemplate.argTypes = {
  content: { control: 'text', defaultValue: 'Default'}
}

export const DefaultRaisedButton = RaisedButtonTemplate.bind({});
DefaultRaisedButton.args = {
  content: 'Default'
}

export const AddButton = RaisedButtonTemplate.bind({});
AddButton.args = {
  content: `<span class="icon icon-plus"></span><span>Ajouter</span>`
} 

export const ViewMapButton = RaisedButtonTemplate.bind({});
ViewMapButton.args = {
  content: `<i class="icon icon-color-secondary icon-map"></i> Voir sur la carte `
} 

const StrokeButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <button vdmStroke>
          ${content}
        </button>`,
    props,
  };
}
StrokeButtonTemplate.argTypes = {
  content: { control: 'text', defaultValue: 'Default'}
}


export const DefaultStrokeButton = StrokeButtonTemplate.bind({});
DefaultStrokeButton.args = {
  content: 'Default'
}

