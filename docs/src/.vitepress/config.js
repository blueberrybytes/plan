import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: "Plan AI",
  description: "The Bot-Free AI Context Engine",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/logos/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/logos/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/logos/apple-touch-icon.png' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Plan AI Docs | The Bot-Free AI Context Engine' }],
    ['meta', { property: 'og:image', content: 'https://plan-ai.blueberrybytes.com/logos/bbb-video.png' }],
    ['meta', { property: 'og:url', content: 'https://docs.plan-ai.blueberrybytes.com' }]
  ],
  themeConfig: {
    logo: '/logos/android-chrome-192x192.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/getting-started/introduction' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Who is it for?', link: '/getting-started/who-its-for' },
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Quick Start', link: '/getting-started/quickstart' },
          { text: 'Architecture', link: '/getting-started/architecture' }
        ]
      },
      {
        text: 'Security & BYOK',
        items: [
          { text: 'BYOK Architecture', link: '/security/byok-architecture' },
          { text: 'Setup OpenRouter', link: '/setup/openrouter' },
          { text: 'Setup Deepgram', link: '/setup/deepgram' },
          { text: 'Setup Mobile Firebase', link: '/setup/mobile-firebase' }
        ]
      },
      {
        text: 'Platform Features',
        items: [
          { text: 'Recordings & Transcripts', link: '/features/recordings' },
          { text: 'Contexts & Advanced RAG', link: '/features/contexts-rag' },
          { text: 'Plan Cortex', link: '/features/cortex' },
          { text: 'Task Sync (Jira, Linear, Trello, Notion, Asana)', link: '/features/task-sync' },
          { text: 'CRM Sync (Twenty)', link: '/features/crm-twenty' },
          { text: 'Docs & Diagrams', link: '/features/docs-diagrams' },
          { text: 'MCP Server', link: '/features/mcp-server' }
        ]
      },
      {
        text: 'Self-Hosting',
        items: [
          { text: 'Environment Variables', link: '/self-hosting/environment-variables' },
          { text: 'Docker Deployment', link: '/self-hosting/docker-deployment' },
          { text: 'Database Migrations', link: '/self-hosting/database-migrations' },
          { text: 'Stripe Billing (optional)', link: '/self-hosting/stripe-billing' }
        ]
      },
      {
        text: 'About',
        items: [
          { text: 'License (BSL 1.1)', link: '/about/license' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/blueberrybytes/plan-ai' }
    ]
  }
}))
