import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'en-US',
  title: 'Nx VitePress',
  description: 'Vite & Vue powered static site generator.',

  srcDir: 'docs',

  themeConfig: {
    nav: [
      { text: 'On-Boarding', link: '/onboard/' },
      { text: 'AGIR', link: '/agir/', activeMatch: '^/$|^/agir/' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/onboard/': getOnBoardSidebar(),
      '/agir/': getAgirSidebar(),
    },
  },
});

function getOnBoardSidebar() {
  return [
    {
      text: 'Introduction',

      items: [
        { text: 'Welcome', link: '/onboard/welcome' },
        { text: 'Dev Environment', link: '/onboard/devenv' },
      ],
    },
  ];
}

const domains: Record<string, string> = {
  annual_program: 'Annual Program',
  program_book: 'Program Book',
};

const domains_menu = Object.keys(domains).map((k) => ({
  text: domains[k],
  link: `/agir/${k}`,
}));

function getAgirSidebar() {
  return [
    {
      text: 'Introduction',
      collapsible: true,
      items: [
        { text: 'Getting Started', link: '/agir/getting-started' },
        { text: 'Configuration', link: '/agir/configuration' },
      ],
    },
    /*   {
        text: 'Domains',
        items: domains_menu 
    }*/
  ];
}
