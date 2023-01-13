import { CommonModule } from '@angular/common';
import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { VdmHeaderBarComponent } from './vdm-header-bar.component';
import { VdmHeaderBarModule } from './vdm-header-bar.module';

export default {
  title: 'AGIR / Header Bar',
  component: VdmHeaderBarComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, VdmHeaderBarModule],
    }),
  ],
} as Meta<VdmHeaderBarComponent>;

const HeaderBarTemplate: Story<VdmHeaderBarComponent> = (args: VdmHeaderBarComponent) => {
  return {
    template: `
        <vdm-header-bar>
        </vdm-header-bar>`,
    props: args,
  };
};

export const Default = HeaderBarTemplate.bind({});
Default.args = {
};
