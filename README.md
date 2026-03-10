<p align="center">
  <img src="public/hero-banner.png" alt="Livetalk Hero Banner" width="100%">
</p>

<h1 align="center">🌐 Livetalk</h1>

<p align="center">
  <strong>Connect with the world, one conversation at a time.</strong><br>
  A modern, secure, and lightning-fast real-time video and text chat platform.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase">
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
</p>

---

## ✨ Features

- 🎥 **Real-time Video Chat**: High-quality, low-latency video streaming for seamless connections.
- 💬 **Instant Text Messaging**: Chat with strangers or friends with real-time typing indicators and message reactions.
- 🎭 **Interest-based Matching**: Find people who share your passions by selecting your interests.
- 🛡️ **Safety First**: Built-in reporting and blocking systems to ensure a respectful environment.
- 📱 **PWA Ready**: Install Livetalk on your home screen for a native app-like experience.
- 🌓 **Dark Mode**: Sleek, modern interface that's easy on the eyes, day or night.
- ⚙️ **Customizable Profiles**: Personalize your experience with custom avatars and display names.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/likhith3035/ohmegle.git
   cd ohmegle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser to see the app.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Backend/Auth**: Supabase
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📁 Project Structure

```text
src/
├── components/     # Reusable UI components (Radix/shadcn)
├── contexts/       # React Contexts for global state
├── hooks/          # Custom React hooks
├── integrations/   # Third-party service integrations
├── lib/            # Utility functions and configurations
├── pages/          # Full page components and layouts
└── App.tsx         # Main application entry point
```

---

<p align="center">
  Made with ❤️ by the Livetalk Team
</p>
