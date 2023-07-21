/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MenuComponent } from './menu.component';
import { MenuDividerComponent } from './menu-divider.component';

import { MenuItemDescriptionDirective } from './menu-item-description.directive';
import { MenuItemLabelDirective } from './menu-item-label.directive';
import { MenuItemDirective } from './menu-item.directive';
import { MenuSectionDirective } from './menu-section.directive';
import { MenuTriggerDirective } from './menu-trigger.directive';


import { componentWrapperDecorator, Meta, moduleMetadata, Story } from '@storybook/angular';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { AvatarComponent, AvatarContentDirective } from '../avatar/avatar.component';
import { CheckboxComponent, CheckBoxDescriptionDirective } from '../checkbox/checkbox.component';

const description = `
The dropdown menu component reveals a list of actions or options
## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Menu déroulant](https://zeroheight.com/575tugn0n/p/3423b2)".
`;

export default {
  title: 'Basic Components / Menu',
  decorators: [
    moduleMetadata({
      declarations: [
        
        // vdm-CheckboxComponent,
        // vdm-RadioButtonComponent,
      ],
      imports: [
        CommonModule,
        OverlayModule,
        PortalModule,
        MenuComponent,
        MenuTriggerDirective,
        MenuItemDirective,
        MenuSectionDirective,
        MenuItemLabelDirective,
        MenuItemDescriptionDirective,
        MenuDividerComponent,
        IconComponent,
        ButtonComponent,
        AvatarComponent, AvatarContentDirective,
        CheckboxComponent, CheckBoxDescriptionDirective
      ],
    }),
    componentWrapperDecorator((story) => `<div style="max-width:30rem;">${story}</div>`),
  ],
  component: MenuComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    _isOpen: {
      table: {
        disable: true,
      },
    },
    menuId: {
      table: {
        disable: true,
      },
    },
    _menuPortal: {
      table: {
        disable: true,
      },
    },
    downKeyEvent: {
      table: {
        disable: true,
      },
    },
    upKeyEvent: {
      table: {
        disable: true,
      },
    },
    focusFirstItem: {
      table: {
        disable:    true,
      },
    },
    focusNextItem: {
      table: {
        disable: true,
      },
    },
    getNextActivableItemIndex: {
      table: {
        disable: true,
      },
    },
    _activeItemIndex: {
      table: {
        disable: true,
      },
    },
    _listItems: {
      table: {
        disable: true,
      },
    },
    canMove: {
      table: {
        disable: true,
      },
    },
    open: {
      table: {
        disable: true,
      },
    },
    close: {
      table: {
        disable: true,
      },
    },
    ngAfterViewInit: {
      table: {
        disable: true,
      },
    },
    _menuContent: {
      table: {
        disable: true,
      },
    },
    tabKeyEvent: {
      table: {
        disable: true,
      },
    },
    shiftTabKeyEvent: {
      table: {
        disable: true,
      },
    },
    setNavigationAttribute: {
      table: {
        disable: true,
      },
    },
    ngAfterContentInit: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<MenuComponent>;



const Template: Story<MenuComponent> = () => ({
  template: `
          <button vdm-button [MenuTriggerFor]="testMenu" type="editorial" level="primary" size="medium" style="margin-right: 1rem;">
              <span>Actions</span>
              <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
          </button>
          <vdm-menu #testMenu>
            <ul>
              <li>
                <a vdm-menu-item>
                  <vdm-menu-item-label>Libellé</vdm-menu-item-label>
                </a>
              </li>   
              <li>
                <a vdm-menu-item>
                  <vdm-menu-item-label>Libellé</vdm-menu-item-label>
                </a>
              </li>
              <li>
                <a vdm-menu-item>
                  <vdm-menu-item-label>Libellé</vdm-menu-item-label>
                </a>
              </li>
            </ul>
          </vdm-menu>
 `,
});

export const Primary = Template.bind({});
Primary.args = {};

export const menuWithDescriptionIcon: Story<MenuComponent> = () => ({
  template: `
      <button vdm-button [MenuTriggerFor]="testMenu1" type="utility" level="secondary" 
        size="medium" style="margin-right: 10rem;">
        <span>Icons</span>
        <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
      </button>
      <vdm-menu #testMenu1>
        <ul>
          <li>
            <a vdm-menu-item>
              <vdm-icon svgIcon="icon-copy" color="tertiary"></vdm-icon>
              <vdm-menu-item-label>Copy</vdm-menu-item-label>
              <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
            </a>
          </li>
          <li>   
            <a vdm-menu-item> 
              <vdm-icon svgIcon="icon-archive"></vdm-icon>
              <vdm-menu-item-label>Archive</vdm-menu-item-label>
              <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
            </a>
          </li>
          <li>
            <a vdm-menu-item> 
              <vdm-icon svgIcon="icon-trash"></vdm-icon>
              <vdm-menu-item-label>Delete</vdm-menu-item-label>
              <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
            </a>
          </li>
        </ul>
      </vdm-menu>
  `,
});
menuWithDescriptionIcon.storyName = 'Dropdown menu - Descriptions and icons';
menuWithDescriptionIcon.args = {
  ...Primary.args,
};

export const menuWithAvatars: Story<MenuComponent> = () => ({
  template: `
    <button vdm-button [MenuTriggerFor]="testMenu2" type="utility" level="secondary" 
      size="medium" style="margin-right: 1rem;">
      <span>Avatars</span>
      <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
    </button>
    <vdm-menu #testMenu2>
      <ul>
        <li>
          <a vdm-menu-item>
            <vdm-avatar color="background-color-2">
              <span vdm-avatar-content>aaaa</span>
            </vdm-avatar>
            <vdm-menu-item-label>Annie</vdm-menu-item-label>
          </a>
        </li>
        <li>   
          <a vdm-menu-item> 
            <vdm-avatar color="background-color-4">
              <span vdm-avatar-content>bg</span>
            </vdm-avatar>
            <vdm-menu-item-label>Benoit</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item> 
            <vdm-avatar color="background-color-3">
              <span vdm-avatar-content>wf</span>
            </vdm-avatar>
            <vdm-menu-item-label>William</vdm-menu-item-label>
          </a>
        </li>
      </ul>
    </vdm-menu>
  `,
});
menuWithAvatars.storyName = 'Dropdown menu - Avatars';
menuWithAvatars.args = {
  ...Primary.args,
};

export const menuWithCheckbox: Story<MenuComponent> = () => ({
  template: `
    <button vdm-button [MenuTriggerFor]="testMenu3" type="utility" level="secondary" 
      size="medium" style="margin-right: 1rem;">
      <span>Checkbox</span>
      <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
    </button>
    <vdm-menu #testMenu3>
      <ul>
        <li>
          <a vdm-menu-item>
            <vdm-checkbox></vdm-checkbox>
            <vdm-menu-item-label>Bananes</vdm-menu-item-label>
            <vdm-menu-item-description>Fruit</vdm-menu-item-description>
          </a>
        </li>
        <li>   
          <a vdm-menu-item [disabled]=true> 
            <vdm-checkbox [disabled]=true></vdm-checkbox>
            <vdm-menu-item-label>Épinards (disabled)</vdm-menu-item-label>
            <vdm-menu-item-description>Légume</vdm-menu-item-description>
          </a>
        </li>
        <li>
          <a vdm-menu-item> 
            <vdm-checkbox></vdm-checkbox>
            <vdm-menu-item-label>Avoine</vdm-menu-item-label>
            <vdm-menu-item-description>Céréale</vdm-menu-item-description>
          </a>
        </li>
      </ul>
    </vdm-menu>
  `,
});
menuWithCheckbox.storyName = 'Dropdown menu - Checkboxes';
menuWithCheckbox.args = {
  ...Primary.args,
};

export const menuWithRadio: Story<MenuComponent> = () => ({
  template: `
    <button vdm-button [MenuTriggerFor]="testMenu4" type="utility" level="secondary" 
      size="medium" style="margin-right: 1rem;">
      <span>Radio buttons</span>
      <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
    </button>
    <vdm-menu #testMenu4>
      <ul>
        <li>
          <a vdm-menu-item>
            <vdm-radio-button></vdm-radio-button>
            <vdm-menu-item-label>Bleu</vdm-menu-item-label>
          </a>
        </li>
        <li>   
          <a vdm-menu-item> 
            <vdm-radio-button></vdm-radio-button>
            <vdm-menu-item-label>Blanc</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item> 
            <vdm-radio-button></vdm-radio-button>
            <vdm-menu-item-label>Rouge</vdm-menu-item-label>
          </a>
        </li>
      </ul>
    </vdm-menu>
  `,
});
menuWithRadio.storyName = 'Dropdown menu - Radio buttons';
menuWithRadio.args = {
  ...Primary.args,
};

export const navigationMenu: Story<MenuComponent> = () => ({
  template: `
    <button vdm-button [MenuTriggerFor]="testMenu5" type="utility" level="secondary" 
      size="medium" style="margin-right: 1rem;">
      <span>Mon compte</span>
      <vdm-icon svgIcon="icon-chevron-down"></vdm-icon>
    </button>
    <vdm-menu #testMenu5>
      <ul>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Services</vdm-menu-item-label>
          </a>
        </li>
        <li>   
          <a vdm-menu-item class="active-link" href=# aria-current="page">
            <vdm-menu-item-label>Demandes</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Tâches</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Journal d'activités</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Informations personnelles</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Paramètre du compte</vdm-menu-item-label>
          </a>
        </li>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Préférences de communication</vdm-menu-item-label>
          </a>
        </li>
        <vdm-menu-divider></vdm-menu-divider>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Ajouter une organisation</vdm-menu-item-label>
          </a>
        </li>
        <vdm-menu-divider></vdm-menu-divider>
        <li>
          <a vdm-menu-item href=#>
            <vdm-menu-item-label>Se déconnecter</vdm-menu-item-label>
          </a>o
        </li>
      </ul>
    </vdm-menu>
  `,
});
navigationMenu.storyName = 'Dropdown menu - Navigation';
navigationMenu.args = {
  ...Primary.args,
};

export const menuSectionsWithIcon: Story<MenuComponent> = () => ({
  template: `
      <button vdm-button [MenuTriggerFor]="testMenu6" type="editorial" level="tertiary" 
        size="medium" style="margin-right: 1rem;">
          <vdm-icon svgIcon="icon-more-vertical"></vdm-icon>
      </button>
      <vdm-menu #testMenu6>
        <ul>
          <li vdm-menu-section>
              Titre de section 1
            <ul>
              <li>
                <a vdm-menu-item>
                  <vdm-icon svgIcon="icon-copy" color="tertiary"></vdm-icon>
                  <vdm-menu-item-label>Copy</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
              <li>   
                <a vdm-menu-item> 
                  <vdm-icon svgIcon="icon-archive"></vdm-icon>
                  <vdm-menu-item-label>Archive</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
              <li>
                <a vdm-menu-item [disabled]=true> 
                  <vdm-icon svgIcon="icon-trash"></vdm-icon>
                  <vdm-menu-item-label>Delete (disabled)</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
            </ul>
          </li>
          <vdm-menu-divider></vdm-menu-divider>
          <li vdm-menu-section>
            Titre de section 2
            <ul>
              <li>
                <a vdm-menu-item>
                  <vdm-icon svgIcon="icon-copy" color="tertiary"></vdm-icon>
                  <vdm-menu-item-label>Copy</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
              <li>   
                <a vdm-menu-item> 
                  <vdm-icon svgIcon="icon-archive"></vdm-icon>
                  <vdm-menu-item-label>Archive</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
              <li>
                <a vdm-menu-item> 
                  <vdm-icon svgIcon="icon-trash"></vdm-icon>
                  <vdm-menu-item-label>Delete</vdm-menu-item-label>
                  <vdm-menu-item-description>Voici une description</vdm-menu-item-description>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </vdm-menu>
  `,
});
menuSectionsWithIcon.storyName = 'Dropdown menu with sections';
menuSectionsWithIcon.args = {
  ...Primary.args,
};

