import { CommonModule } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmButtonModule } from './vdm-button/vdm-button.module';

export default {
  title: 'AGIR / Showcase / Buttons',
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
      <aside>
        <pre>
          AGIR button style looks weird regarding what is declared in Bootstrap. 
          see <a href="https://getbootstrap.com/docs/5.0/components/buttons/">https://getbootstrap.com/docs/5.0/components/buttons/</a>
        </pre>
      </aside>
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
      <hr>
      <hr>
      <section>
        Bootstrap secondary style looks weird in AGIR theme
      </section>
      <section>
        <div class="showcase-label">Bootstrap default</div>
        <div class="showcase-row">
          <button class="btn btn-primary">
            <span>Primary</span>
          </button>
          <button class="btn btn-secondary">
            <span>Secondary</span>
          </button>
          <button class="btn btn-success">
            <span>Success</span>
          </button>
          <button class="btn btn-danger">
            <span>Danger</span>
          </button>
          <button class="btn btn-info">
            <span>Info</span>
          </button>
          <button class="btn btn-light">
            <span>Light</span>
          </button>
          <button class="btn btn-dark">
            <span>Dark</span>
          </button>
          <button class="btn btn-link">
            <span>Link</span>
          </button>
        </div>
      </section>
      <section>
        <div class="showcase-label">Bootstrap outlined</div>
        <div class="showcase-row">
          <button class="btn btn-outline-primary">
            <span>Primary</span>
          </button>
          <button class="btn btn-outline-secondary">
            <span>Secondary</span>
          </button>
          <button class="btn btn-outline-success">
            <span>Success</span>
          </button>
          <button class="btn btn-outline-danger">
            <span>Danger</span>
          </button>
          <button class="btn btn-outline-info">
            <span>Info</span>
          </button>
          <button class="btn btn-outline-light">
            <span>Light</span>
          </button>
          <button class="btn btn-outline-dark">
            <span>Dark</span>
          </button>
          <button class="btn btn-outline-link">
            <span>Link</span>
          </button>
        </div>
      </section>
      <hr>
      <hr>
      <section>
        <div class="showcase-label">Weird</div>
        <div class="showcase-row">
          <button vdmButton class="bg-white btn-md ml-2">
            <span>Toto</span>
          </button>
          <button vdmButton class="toto">
            <span>Toto</span>
          </button>
        </div>
      </section>
    </div>
    `,
    props,
  };
};

export const DefaultPresentation = PresentationTemplate.bind({});
DefaultPresentation.args = {};
