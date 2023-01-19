import { CommonModule } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmButtonModule } from './vdm-button/vdm-button.module';

export default {
  title: 'AGIR / Showcase',
  component: HTMLButtonElement,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, VdmButtonModule],
    }),
  ],
} as Meta<HTMLButtonElement>;

type ButtonTemplateType = HTMLButtonElement & { content: string };

const PresentationTemplate: Story<ButtonTemplateType> = (args: ButtonTemplateType) => {
  const { content, ...props } = args;
  return {
    template: `
    <div class="showcase">
      <section>
        <div class="showcase-label">Basic</div>
        <div class="showcase-row">
          <button vdmButton >Basic</button>
          <button vdmButton color="primary" >Primary</button>
          <button vdmButton color="accent" >Accent</button>
          <button vdmButton color="warn" >Warn</button>
          <button vdmButton disabled >Disabled</button>
        </div>
      </section>
      <hr>
      <section>
        <div class="showcase-label">Strike</div>
        <div class="showcase-row">
          <button vdmStroke >Basic</button>
          <button vdmStroke color="primary" >Primary</button>
          <button vdmStroke color="accent" >Accent</button>
          <button vdmStroke color="warn" >Warn</button>
          <button vdmStroke disabled >Disabled</button>
        </div>
      </section>
      <hr>
      <section>
        <div class="showcase-label">Raised</div>
        <div class="showcase-row">
          <button vdmRaised >Basic</button>
          <button vdmRaised color="primary">Primary</button>
          <button vdmRaised color="accent">Accent</button>
          <button vdmRaised color="warn">Warn</button>
          <button vdmRaised disabled>Disabled</button>
        </div>
      </section>
      <hr>
      <section>
        <div class="showcase-label">Real</div>
        <div class="showcase-row">
          <button vdmRaised>
            <span class="icon icon-plus"></span><span>Ajouter</span>
          </button>
          <button vdmRaised color="primary">
            <i class="icon icon-color-secondary icon-map"></i> Voir sur la carte
          </button>
          <button vdmRaised color="primary"  >
            <span class="icon icon-plus"></span><span>Ajouter</span>
          </button>
          <button vdmRaised color="warn">
            <span>Supprimer</span>
          </button>
        </div>
      </section>
      
    `,
    props,
  };
};

export const Buttons = PresentationTemplate.bind({});
Buttons.args = {};
