/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */
import { Meta, Story } from '@storybook/angular';
import { IconComponent } from './icon.component';

const description = `
If a color is provided, it will be used as the icon's color. If no color is provided, the default behaviour is to use the parent's text color.
## Documentation
The full documentation of this component is available in the Hochelaga design system documentation under "[Icônes utilitaires](https://zeroheight.com/575tugn0n/p/439e2a)".
`;

export default {
  title: 'Basic components / Icon',
  component: IconComponent,
  parameters: {
    docs: {
      description: {
        component: description
      }
    }
  },
  argTypes: {
    addTitleToSVG: {
      table: {
        disable: true
      }
    },
    clearSvgElement: {
      table: {
        disable: true
      }
    },
    generateUniqueTitleId: {
      table: {
        disable: true
      }
    },
    ngOnDestroy: {
      table: {
        disable: true
      }
    },
    setSvgElement: {
      table: {
        disable: true
      }
    },
    updateSvgIcon: {
      table: {
        disable: true
      }
    },
    _elementsWithExternalReferences: {
      table: {
        disable: true
      }
    },
    _svgIcon: {
      table: {
        disable: true
      }
    },
    _title: {
      table: {
        disable: true
      }
    },
    _titleId: {
      table: {
        disable: true
      }
    }
  }
} as Meta<IconComponent>;

const Template: Story<IconComponent & { title: string; content: string }> = (
  args: IconComponent
) => ({
  component: IconComponent,
  template: `
  <div style="display: grid; grid-column-gap: 1rem; grid-template-columns: 2rem 2rem 2rem 2rem 2rem 2rem 2rem 2rem 2rem 2rem">
  <vdm-icon [color]="color" [size]="size" title="anchor" svgIcon="icon-anchor"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="apps" svgIcon="icon-apps"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="archive" svgIcon="icon-archive"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="arrow-left" svgIcon="icon-arrow-left"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="arrow-right" svgIcon="icon-arrow-right"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="bell-active" svgIcon="icon-bell-active"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="bell-off" svgIcon="icon-bell-off"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="bell" svgIcon="icon-bell"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="bolt" svgIcon="icon-bolt"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="book" svgIcon="icon-book"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="briefcase" svgIcon="icon-briefcase"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="calendar" svgIcon="icon-calendar"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="cell-phone" svgIcon="icon-cell-phone"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="check-circle-full" svgIcon="icon-check-circle-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="check-circle" svgIcon="icon-check-circle"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="check" svgIcon="icon-check"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="chevron-down" svgIcon="icon-chevron-down"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="chevron-left" svgIcon="icon-chevron-left"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="chevron-right" svgIcon="icon-chevron-right"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="chevron-up" svgIcon="icon-chevron-up"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="clipboard" svgIcon="icon-clipboard"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="clock" svgIcon="icon-clock"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="comment" svgIcon="icon-comment"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="cone-fill" svgIcon="icon-cone-fill"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="cone" svgIcon="icon-cone"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="copy" svgIcon="icon-copy"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="copyright" svgIcon="icon-copyright"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="cut" svgIcon="icon-cut"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="delivery" svgIcon="icon-delivery"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="dot-bullet" svgIcon="icon-dot-bullet"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="dot-interpunct" svgIcon="icon-dot-interpunct"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="download" svgIcon="icon-download"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="droplet" svgIcon="icon-droplet"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="duplicate" svgIcon="icon-duplicate"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="edit" svgIcon="icon-edit"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="email" svgIcon="icon-email"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="error" svgIcon="icon-error"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="exclamation" svgIcon="icon-exclamation"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="externallink" svgIcon="icon-externallink"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="eye-off" svgIcon="icon-eye-off"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="eye" svgIcon="icon-eye"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="file-edit" svgIcon="icon-file-edit"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="file-pdf" svgIcon="icon-file-pdf"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="file" svgIcon="icon-file"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="filters" svgIcon="icon-filters"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="flag" svgIcon="icon-flag"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="folder" svgIcon="icon-folder"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="heart" svgIcon="icon-heart"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="help" svgIcon="icon-help"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="home" svgIcon="icon-home"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="image" svgIcon="icon-image"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="info" svgIcon="icon-info"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="key" svgIcon="icon-key"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="layers" svgIcon="icon-layers"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="link" svgIcon="icon-link"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="list" svgIcon="icon-list"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="location" svgIcon="icon-location"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="lock" svgIcon="icon-lock"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="log-in" svgIcon="icon-log-in"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="log-out" svgIcon="icon-log-out"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="map" svgIcon="icon-map"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="menu" svgIcon="icon-menu"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="minus-circle-full" svgIcon="icon-minus-circle-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="minus-circle" svgIcon="icon-minus-circle"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="minus" svgIcon="icon-minus"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="money" svgIcon="icon-money"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="more-horizontal" svgIcon="icon-more-horizontal"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="more-vertical" svgIcon="icon-more-vertical"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="music" svgIcon="icon-music"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="package" svgIcon="icon-package"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="paperclip" svgIcon="icon-paperclip"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="partner-bell" svgIcon="icon-partner-bell"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="partner-hydroquebec" svgIcon="icon-partner-hydroquebec"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="phone" svgIcon="icon-phone"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="plus-circle-full" svgIcon="icon-plus-circle-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="plus-circle" svgIcon="icon-plus-circle"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="plus" svgIcon="icon-plus"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="position" svgIcon="icon-position"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="print" svgIcon="icon-print"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="refresh" svgIcon="icon-refresh"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="road" svgIcon="icon-road"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="save" svgIcon="icon-save"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="search" svgIcon="icon-search"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="send" svgIcon="icon-send"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="settings" svgIcon="icon-settings"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="share" svgIcon="icon-share"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="shoppingbag" svgIcon="icon-shoppingbag"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-facebook" svgIcon="icon-social-facebook"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-flickr" svgIcon="icon-social-flickr"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-instagram" svgIcon="icon-social-instagram"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-linkedin" svgIcon="icon-social-linkedin"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-twitter" svgIcon="icon-social-twitter"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="social-youtube" svgIcon="icon-social-youtube"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="star" svgIcon="icon-star"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="steps" svgIcon="icon-steps"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="table" svgIcon="icon-table"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="tag" svgIcon="icon-tag"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="thumb-down-full" svgIcon="icon-thumb-down-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="thumb-down" svgIcon="icon-thumb-down"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="thumb-up-full" svgIcon="icon-thumb-up-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="thumb-up" svgIcon="icon-thumb-up"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="ticket" svgIcon="icon-ticket"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="trash" svgIcon="icon-trash"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="unlock" svgIcon="icon-unlock"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="upload" svgIcon="icon-upload"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="user-circle" svgIcon="icon-user-circle"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="user" svgIcon="icon-user"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="users" svgIcon="icon-users"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="warning" svgIcon="icon-warning"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="website" svgIcon="icon-website"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="wheelchair" svgIcon="icon-wheelchair"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="x-circle-full" svgIcon="icon-x-circle-full"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="x-circle" svgIcon="icon-x-circle"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="x" svgIcon="icon-x"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="spinner" svgIcon="icon-spinner"></vdm-icon>
  <vdm-icon [color]="color" [size]="size" title="emergency" svgIcon="icon-emergency"></vdm-icon>
</div>
 `,
  props: args
});

export const Primary = Template.bind({});
