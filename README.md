<h1 align="center">✨ Livetalk by Likki (Ohmegle) ✨</h1>

<p align="center">
  <strong>The Next-Generation Anonymous WebRTC Video & Real-Time Chat Platform.</strong><br>
  A high-performance, zero-log, hybrid-backed platform engineered for modern web & mobile devices.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/WebRTC-P2P_Mesh-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC">
  <img src="https://img.shields.io/badge/Capacitor-Android-1192E8?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor">
  <img src="https://img.shields.io/badge/Tailwind-CSS_v3-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Vitest-Unit_Tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
</p>

---

## 🚀 Key Highlights & Architectural Overview

Livetalk combines the spontaneous charm of classic video roulette with state-of-the-art WebRTC P2P communication, strict client-side encryption, and modern responsive design system standards.

> [!NOTE]
> **Zero-Log Privacy Policy**: All matchmaking keys, temporary room signals, and WebRTC handshakes are held in transient memory only and purged immediately upon connection or disconnect.

---

## ⚡ Technical Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Fast HMR, optimized production code-splitting with `lazyWithRetry()` |
| **Language & Safety** | TypeScript 5.8 | Strict type checking with 0 explicit `any` violations |
| **Realtime Engine** | Firebase RTDB + Supabase | Low-latency matchmaking queues & fallback signaling |
| **Media Transport** | P2P WebRTC | Adaptive ICE candidate resolution (Google STUN + OpenRelay TURN) |
| **Styling & UI** | Tailwind CSS + Framer Motion | Dynamic dark/light themes, fluid micro-animations, WCAG 2.2 AA contrast |
| **Mobile & Native** | Capacitor + PWA | Native Android background call keep-alive foreground services |
| **Testing** | Vitest | Unit & integration testing suite for media cleanup & AI algorithms |

---

## 🤝 Architecture & Matchmaking Sequence

```mermaid
sequenceDiagram
    autonumber
    participant ClientA as 👤 User A
    participant Firebase as 🔥 Firebase RTDB
    participant ClientB as 👤 User B
    participant WebRTC as 🌐 Direct P2P Channel

    ClientA->>Firebase: Register in Matchmaking Lobby (Interests: Tech, Music)
    ClientB->>Firebase: Register in Matchmaking Lobby (Interests: Tech, Gaming)
    Note over Firebase: Matchmaker calculates weighted interest overlap ("Tech")
    Firebase-->>ClientA: Match Assigned (Session ID)
    Firebase-->>ClientB: Match Assigned (Session ID)
    ClientA->>Firebase: Publish WebRTC SDP Offer
    Firebase-->>ClientB: Receive WebRTC SDP Offer
    ClientB->>Firebase: Publish WebRTC SDP Answer
    Firebase-->>ClientA: Receive WebRTC SDP Answer
    Note over Firebase: Purge transient signaling keys from RTDB
    ClientA<==>ClientB: Direct Encrypted WebRTC P2P Video/Audio Stream
```

---

## 🌟 Features & Capabilities

- 🎥 **HD WebRTC P2P Video Calls**: Turn-assisted peer-to-peer audio and video streaming with real-time resolution/FPS monitoring.
- 💬 **Real-time Encrypted Text Chat**: Instant messaging powered by Supabase Realtime with emoji reactions, message translation, and sound notifications.
- 📱 **Mobile-First Dynamic Viewport (`100dvh`)**: Mobile Safari and Chrome layout stability with dynamic viewport height support and safe-area padding.
- 🎮 **In-Chat Games & AI Wingman**: Integrated Tic-Tac-Toe AI minigames and interactive icebreakers.
- 🔒 **Biometric Lock & Security**: Built-in biometric protection options (`capacitor-native-biometric`).
- 🤖 **Cross-Device Handoff**: Scan QR code to transfer calls seamlessly between mobile and desktop devices.
- 🎨 **Glassmorphism & Theme System**: Responsive high-contrast design system adhering to WCAG 2.2 AA accessibility guidelines.

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn**

### 2. Clone & Install Dependencies
```bash
# Clone repository
git clone https://github.com/likhith3035/ohmegle.git
cd ohmegle

# Install package dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root (reference `.env.example`):
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_SUPABASE_URL=https://your_supabase_id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ⚙️ Development & Testing Commands

```bash
# Start local development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run Vitest test suite
npm test

# Run ESLint check
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📱 Mobile App Build (Capacitor Android)

To build the native Android application package:

```bash
# Sync web build to native Android project
npx cap sync android

# Open Android Studio project
npx cap open android
```

---

## 📜 License & Compliance

Distributed under the MIT License. Built with strict adherence to privacy-first web standards.
