import { CommonModule } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmButtonModule } from '../vdm-button/vdm-button.module';
import { VdmButtonComponent } from './vdm-button.component';

export default {
  title: 'AGIR / Button',
  component: VdmButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, VdmButtonModule],
    })
  ]
} as Meta<VdmButtonComponent>;


export const EmptyButton: Story<VdmButtonComponent> = () => ({});

type ButtonTemplateType =  VdmButtonComponent & { content: string }

const ButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <vdm-button vdmButton>
          ${content}
        </vdm-button>`,
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

export const AddButton = ButtonTemplate.bind({});
AddButton.args = {
  content: `<span class="icon icon-plus"></span><span>Ajouter</span>`
} 


export const ViewMapButton = ButtonTemplate.bind({});
ViewMapButton.args = {
  content: `<i class="icon icon-color-secondary icon-map"></i> Voir sur la carte `
} 

const RaisedButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <vdm-button vdmRaised>
          ${content}
        </vdm-button>`,
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

const StrokeButtonTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
        <vdm-button vdmStroke>
          ${content}
        </vdm-button>`,
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
