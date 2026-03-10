<p align="center">
  <img src="public/hero-banner.png" alt="Livetalk Hero" width="100%" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
</p>

<h1 align="center">✨ Livetalk by Likki ✨</h1>

<p align="center">
  <strong>The Ultimate Omegle 2 Alternative — Where Privacy Meets Fun.</strong><br>
  A feature-rich, high-performance, and anonymous video & text chat platform built with modern tech.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
</p>

---

## 🚀 Why Livetalk?

In a world of data tracking and complex sign-ups, **Livetalk** brings back the raw, spontaneous, and private nature of the internet. No accounts. No logs. Just instant human connection across the globe.

### 🌟 Exclusive Features

| Feature | Description |
| :--- | :--- |
| 🎥 **HD Video Calls** | One-tap switch from text to high-latency video chat with peer-to-peer security. |
| 🎮 **In-Chat Games** | Play **Truth or Dare** and **Tic-Tac-Toe** directly with your match. |
| 🛡️ **Stealth Mode** | Zero logs. End-to-end encryption. Disappearing messages (30s to 5m). |
| 🌈 **Dynamic Themes** | Transform your UI with **Ocean**, **Sunset**, **Neon**, and **Midnight** themes. |
| 📊 **Real-time Polls** | Create instant polls to break the ice or settle debates mid-conversation. |
| 🎭 **Mood Meter** | Express yourself visually with a real-time mood indicator for your match. |
| 📍 **Interest Match** | Find people who share your passions for tech, music, games, or art. |
| 📱 **Full PWA Support** | Install it on your iOS or Android home screen for a native app feel. |

---

## 🛠️ Technology Stack

Livetalk is engineered for speed, scalability, and smoothness.

- **Frontend Core**: [React 18](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/) for robust, type-safe development.
- **Build System**: [Vite](https://vitejs.dev/) — Lightning-fast HMR and optimized builds.
- **Real-time Engine**: [Supabase Realtime](https://supabase.com/realtime) handles the messaging, presence, and match orchestrations.
- **Micro-Animations**: [Framer Motion](https://www.framer.com/motion/) powers silky-smooth transitions and spring-based interactions.
- **Styling Architecture**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) for a sleek, responsive, and accessible interface.
- **Icons & Graphics**: [Lucide React](https://lucide.dev/) for a consistent, modern iconography.

---

## 📂 Project Architecture

```text
src/
├── components/
│   ├── chat/        # 💠 Core engine: Games, Polls, Video, Mood Meter
│   ├── ui/          # 🎨 Polished primitive components (Radix + Tailwind)
│   └── common/      # ⚙️ Helper components like Header, Logo, BottomNav
├── contexts/        # 🧠 Global state (Chat context, Auth context)
├── hooks/           # 🎣 Custom logic: use-online-count, use-match, use-seo
├── integrations/    # 🔗 Supabase, Tenor, and Giphy connectors
├── pages/           # 📄 Route layouts: Index, Chat, SafetyCenter, Profile
└── lib/             # 🛠️ Shared utilities and theme definitions
```

---

## 🚦 Getting Started (Development)

### 1. Requirements
Ensure you have **Node.js v18+** and **npm** installed.

### 2. Setup
```bash
# Clone the repo
git clone https://github.com/likhith3035/ohmegle.git
cd ohmegle

# Install dependencies (highly recommend bun for speed)
npm install
# or
bun install
```

### 3. Environment Config
Rename `.env.example` to `.env` and fill in your Supabase details:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

### 4. Ignite!
```bash
npm run dev
```

---

## 🗺️ Roadmap & Future Vision

- [ ] **AI Voice Modulation** - Change your voice in real-time during calls.
- [ ] **AR Filters** - Snapchat-like filters for anonymous video chatting.
- [ ] **Squad Rooms** - Small group chats for 3-5 people based on topics.
- [ ] **Global Translator** - Real-time message translation for cross-border chats.

---

## 👨‍💻 Developer & Visionary

Developed with 💜 by **Likhith Kami**.

<a href="https://instagram.com/Lucky__likhith" target="_blank">
  <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
</a>
<a href="https://www.linkedin.com/in/likhith-kami/" target="_blank">
  <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
</a>
<a href="mailto:kamilikhith@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
</a>

<p align="center">
  <i>"Connecting the world, one private conversation at a time."</i><br>
  <b>© 2026 Livetalk. All rights reserved.</b>
</p>
