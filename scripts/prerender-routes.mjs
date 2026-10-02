/**
 * IncogTalk — Static Route Prerender Script
 * 
 * Runs after `vite build` to generate per-route HTML files with unique
 * <title>, <meta>, canonical URL, og tags, and JSON-LD schemas baked in.
 * 
 * This ensures search engine crawlers see unique content per page without
 * needing to execute JavaScript.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const BASE_URL = 'https://incogtalkk.netlify.app';

// ─── Route definitions with SEO metadata ─────────────────────────────────
const ROUTES = [
  {
    path: '/chat',
    title: 'Anonymous Video & Text Chat | IncogTalk',
    description: 'Connect instantly with strangers worldwide for anonymous peer-to-peer WebRTC video and text conversations. No signup, no tracking. Speak freely. Stay incognito.',
    keywords: 'anonymous chat, video chat strangers, random chat, talk to strangers, omegle alternative, free video call, webcam chat, incogtalk chat',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Anonymous Video & Text Chat",
      "description": "Connect instantly with strangers worldwide for anonymous peer-to-peer WebRTC video and text conversations.",
      "url": `${BASE_URL}/chat`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/games',
    title: 'IncogTalk Arcade – Play 1v1 Games Online | Hand Cricket, SOS, Bingo',
    description: 'Play 1v1 multiplayer games online free — Hand Cricket, SOS Neon Duel, Bingo Blitz, Connect Four, Tic-Tac-Toe, Reaction Dash, Rock Paper Scissors, and Memory Duel. No download needed.',
    keywords: '1v1 games online, multiplayer games, hand cricket online, bingo blitz, connect four online, tic tac toe online, reaction game, sos game, incogtalk arcade, memory duel',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "IncogTalk Arcade – 1v1 Multiplayer Games",
      "description": "Play 1v1 multiplayer games online free including Hand Cricket, SOS Neon Duel, Bingo Blitz, and more.",
      "url": `${BASE_URL}/games`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/code',
    title: 'Code Studio – Free Online IDE & Code Playground | IncogTalk',
    description: 'Write, run, and test JavaScript, Python, C++, SQL, and TypeScript code in your browser. Free online IDE with syntax highlighting, test cases, and instant execution. No setup required.',
    keywords: 'online code editor, free online IDE, code playground, run javascript online, run python online, run c++ online, code studio, incogtalk code',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Code Studio – Online IDE",
      "description": "Write, run, and test code in JavaScript, Python, C++, SQL, and TypeScript directly in your browser.",
      "url": `${BASE_URL}/code`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/file-sharing',
    title: 'Encrypted File Sharing – AES-256 Secure Transfer | IncogTalk',
    description: 'Share files with military-grade AES-256 client-side encryption. Burn-after-reading self-destruct mode, 1-click ZIP downloads, and passcode-locked shares. Zero server-side storage.',
    keywords: 'encrypted file sharing, secure file transfer, burn after reading, AES-256 encryption, anonymous file share, self-destruct file, incogtalk file sharing',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Encrypted File Sharing",
      "description": "Client-side AES-256 encrypted file transfer with burn-after-reading self-destruct mode.",
      "url": `${BASE_URL}/file-sharing`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/ai-chat',
    title: 'AI Chat Studio – Chat with AI Companions | IncogTalk',
    description: 'Chat anonymously with intelligent AI companions and diverse personas. Powered by modern LLMs in complete privacy. No chat logs, no tracking.',
    keywords: 'AI chat, chat with AI, AI companion, AI persona chat, free AI chat, anonymous AI chat, incogtalk ai',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AI Chat Studio",
      "description": "Chat anonymously with intelligent AI companions powered by modern LLMs in complete privacy.",
      "url": `${BASE_URL}/ai-chat`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/prompt-analyzer',
    title: 'AI Prompt Analyzer – Score & Optimize Prompts | IncogTalk',
    description: 'Score, benchmark, and optimize your AI prompts with instant clarity improvements and before-after comparisons. Free prompt quality analyzer.',
    keywords: 'AI prompt analyzer, prompt optimizer, prompt scoring, prompt quality, AI prompt engineering, optimize prompts, incogtalk prompt',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AI Prompt Analyzer",
      "description": "Score and optimize AI prompts with real-time clarity grading and quality scoring.",
      "url": `${BASE_URL}/prompt-analyzer`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/profile',
    title: 'Anonymous Profile & Customizer | IncogTalk',
    description: 'Customize your anonymous chat identity with avatars, mood status, nickname, and personal privacy preferences. No real identity required.',
    keywords: 'anonymous profile, chat profile, avatar customizer, anonymous identity, incogtalk profile',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Anonymous Profile",
      "description": "Customize your anonymous chat avatar, mood status, nickname, and personal privacy preferences.",
      "url": `${BASE_URL}/profile`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/info',
    title: 'About IncogTalk – Mission, Architecture & FAQ | IncogTalk',
    description: 'Learn about IncogTalk — the mission, architecture, technology stack, and frequently asked questions. Built by Likhith Kami (Likki).',
    keywords: 'about incogtalk, incogtalk faq, who made incogtalk, likhith kami, likki developer, incogtalk info',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "About IncogTalk",
      "description": "The mission, architecture, and technology behind IncogTalk built by developer Likhith Kami (Likki).",
      "url": `${BASE_URL}/info`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/safety',
    title: 'Safety Center & Privacy Guide | IncogTalk',
    description: 'Comprehensive safety tips, zero-logging verification, anti-record shields, and user protection guidelines for safe anonymous chatting.',
    keywords: 'chat safety, online safety, privacy guide, anonymous chat safety, incogtalk safety, anti screenshot',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Safety Center",
      "description": "Privacy architecture, anti-screenshot protections, and community safety advice.",
      "url": `${BASE_URL}/safety`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/guidelines',
    title: 'Community Guidelines | IncogTalk',
    description: 'Rules and conduct standards for a safe, welcoming, and respectful anonymous community. Read before chatting.',
    keywords: 'community guidelines, chat rules, incogtalk guidelines, user conduct, anonymous chat rules',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Community Guidelines",
      "description": "Official rules and behavior guidelines to keep IncogTalk safe and respectful.",
      "url": `${BASE_URL}/guidelines`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | IncogTalk',
    description: 'IncogTalk collects zero personal data. Read our full privacy policy — no cookies, no tracking, no server-side chat logs.',
    keywords: 'privacy policy, incogtalk privacy, zero tracking, no cookies, anonymous privacy',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy",
      "description": "IncogTalk's complete privacy policy — zero data collection, no cookies, no tracking.",
      "url": `${BASE_URL}/privacy`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  },
  {
    path: '/terms',
    title: 'Terms of Service | IncogTalk',
    description: 'IncogTalk Terms of Service — rules governing usage of the anonymous chat platform, file sharing, arcade games, and AI tools.',
    keywords: 'terms of service, incogtalk terms, user agreement, tos',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Terms of Service",
      "description": "Terms of Service governing usage of the IncogTalk platform.",
      "url": `${BASE_URL}/terms`,
      "isPartOf": { "@type": "WebSite", "name": "IncogTalk", "url": BASE_URL }
    }
  }
];

// ─── Helper: replace meta content in HTML ─────────────────────────────────
function replaceOrInsertMeta(html, selector, attr, value) {
  // Try to replace existing tag
  const nameMatch = selector.match(/name="([^"]+)"/);
  const propMatch = selector.match(/property="([^"]+)"/);
  
  if (nameMatch) {
    const regex = new RegExp(`<meta\\s+name="${nameMatch[1]}"[^>]*>`, 'i');
    if (regex.test(html)) {
      return html.replace(regex, `<meta name="${nameMatch[1]}" ${attr}="${value}" />`);
    }
    // Insert before </head>
    return html.replace('</head>', `  <meta name="${nameMatch[1]}" ${attr}="${value}" />\n</head>`);
  }
  
  if (propMatch) {
    const regex = new RegExp(`<meta\\s+property="${propMatch[1]}"[^>]*>`, 'i');
    if (regex.test(html)) {
      return html.replace(regex, `<meta property="${propMatch[1]}" ${attr}="${value}" />`);
    }
    return html.replace('</head>', `  <meta property="${propMatch[1]}" ${attr}="${value}" />\n</head>`);
  }
  
  return html;
}

function replaceCanonical(html, url) {
  return html.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${url}" />`
  );
}

function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
}

function injectPageSchema(html, schema) {
  const schemaJson = JSON.stringify(schema);
  const schemaTag = `<script type="application/ld+json" id="page-prerender-schema">${schemaJson}</script>`;
  return html.replace('</head>', `  ${schemaTag}\n</head>`);
}

// ─── Main ─────────────────────────────────────────────────────────────────
function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }
  
  const baseHtml = fs.readFileSync(indexPath, 'utf-8');
  let count = 0;
  
  for (const route of ROUTES) {
    let html = baseHtml;
    const fullUrl = `${BASE_URL}${route.path}`;
    
    // Replace <title>
    html = replaceTitle(html, route.title);
    
    // Replace canonical
    html = replaceCanonical(html, fullUrl);
    
    // Replace meta description
    html = replaceOrInsertMeta(html, 'name="description"', 'content', route.description);
    
    // Replace meta keywords
    html = replaceOrInsertMeta(html, 'name="keywords"', 'content', route.keywords);
    
    // Replace OG tags
    html = replaceOrInsertMeta(html, 'name="title"', 'content', route.title);
    html = replaceOrInsertMeta(html, 'property="og:title"', 'content', route.title);
    html = replaceOrInsertMeta(html, 'property="og:description"', 'content', route.description);
    html = replaceOrInsertMeta(html, 'property="og:url"', 'content', fullUrl);
    
    // Replace Twitter tags
    html = replaceOrInsertMeta(html, 'name="twitter:title"', 'content', route.title);
    html = replaceOrInsertMeta(html, 'name="twitter:description"', 'content', route.description);
    
    // Inject page-specific schema
    html = injectPageSchema(html, route.schema);
    
    // Write to route directory
    const routeDir = path.join(DIST_DIR, route.path);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
    
    count++;
    console.log(`  ✅ ${route.path}/index.html — "${route.title}"`);
  }
  
  console.log(`\n🎉 Prerendered ${count} routes with unique SEO metadata.`);
}

console.log('\n🔍 IncogTalk SEO Prerender — Generating static route pages...\n');
main();
