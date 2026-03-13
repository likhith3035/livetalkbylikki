<h1 align="center">✨ Livetalk by Likki ✨</h1>

<p align="center">
  <strong>The #1 Omegle Alternative — Where Privacy Meets Premium Human Connection.</strong><br>
  A high-performance, hybrid-powered anonymous video & text chat platform engineered for the modern web.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
</p>

---

## 🚀 The Vision

Livetalk is built to bring back the raw, spontaneous, and private human connections of the early internet, but with the speed and elegance of the modern era. No accounts, no trackers, no historical logs. Just you and a stranger, connecting instantly.

---

## 🤝 How Matchmaking Works

Experience a seamless connection flow powered by our **Hybrid-Logic Engine**. 

### 1. The Matchmaking Pulse
When you click "Start", our system places you in a high-speed **Lobby** on Firebase. It instantly scans for other waiting users and prioritizes those with **Shared Interests**.

```mermaid
sequenceDiagram
    participant UA as 👤 User A
    participant FB as 🔥 Firebase Lobby
    participant UB as 👤 User B
    
    UA->>FB: Enter Lobby (Interests: Tech, Music)
    UB->>FB: Enter Lobby (Interests: Tech, Gaming)
    Note over FB: Engine detects shared interest: "Tech"
    FB-->>UA: Match Found! (Stranger: User B)
    FB-->>UB: Match Found! (Stranger: User A)
```

### 2. The Smart Handshake
Once matched, a private **Signaling Channel** is created. This is where the magic happens: users exchange encrypted "handshake" data (ICE Candidates) via Firebase to find the fastest direct path to each other.

```mermaid
graph LR
    A["👤 User A"] -- "1. Send Offer" --> F[("🔥 Firebase Signaling")]
    F -- "2. Receive Offer" --> B["👤 User B"]
    B -- "3. Send Answer" --> F
    F -- "4. Receive Answer" --> A
    A <== "5. Direct WebRTC P2P Connection" ==> B
```

### 3. Live Interaction
The moment you connect:
- **Video/Audio**: Streamed directly between you and the stranger (Peer-to-Peer).
- **Text Chat**: Handled by **Supabase Realtime** for lightning-fast message delivery and reactions.
- **Privacy Assurance**: All transient data in Firebase is **deleted the nanosecond** you are connected.

---

## 🌟 Premium Features

| Feature | Description | Technical Edge |
| :--- | :--- | :--- |
| ⚡ **Instant Match** | Connect with strangers across the globe in milliseconds. | Firebase RTDB optimized lobby. |
| 🎥 **HD Video Calls** | One-tap switch from text to high-latency video chat. | P2P WebRTC with Firebase signaling. |
| 🛡️ **Zero-Log Privacy** | Your data only exists as long as your conversation does. | Aggressive transient data policy. |
| 🎮 **In-Chat Games** | Break the ice with built-in games like Tic-Tac-Toe. | Real-time state syncing. |
| 🌈 **Glassmorphic UI** | Stunning themes like **Ocean**, **Sunset**, and **Midnight**. | Tailwind CSS + Framer Motion. |
| 🎭 **Mood Meter** | Express yourself with a real-time reactive mood indicator. | Live Supabase presence sync. |
| 📍 **Interest Match** | Find people who share your specific passions. | Weighted interest pairing logic. |
| 📱 **Full PWA Support** | Desktop-class experience on iOS and Android. | Service Worker optimization. |

---

## 🛡️ Privacy & Security First

- **Stateless Design**: We don't use databases for message history. Once you refresh or disconnect, the chat is gone forever.
- **Transient Signaling**: Firebase keys are only held in memory during the matchmaking phase and wiped the moment the connection is established.
- **Environment Isolation**: Critical API keys are managed via `.env` files to prevent exposure in open-source clones.

---

## 🚦 Installation & Setup

### 1. Prerequisite
Ensure you have **Node.js 18+** and a package manager installed.

### 2. Fast Track Setup
```bash
# Clone the repository
git clone https://github.com/likhith3035/ohmegle.git
cd ohmegle

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Backend Configuration
- **Supabase**: Create a new project and add your URL/Anon Key to `.env`.
- **Firebase**: Enable **Realtime Database** and set location to `us-central1`. 
- **Security Rules**: Copy the rules from [DEVELOPMENT.md](./DEVELOPMENT.md) into your Firebase console.

### 4. Launch
```bash
npm run dev
```

---

## 🗺️ Future Roadmap

- [ ] **AI Voice Modulation** - Real-time voice effects during calls.
- [ ] **Global Translator** - Instant translation for international matches.
- [ ] **Augmented Reality** - Snapchat-style face filters during video calls.
- [ ] **Squad Rooms** - Topic-based group chats for 3-5 people.

---

## 👨‍💻 Developer & Visionary

Developed with 💜 by **Likhith Kami**.

<div align="center">
  <a href="https://instagram.com/Lucky__likhith" target="_blank">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://www.linkedin.com/in/likhith-kami/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  <a href="mailto:kamilikhith@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
</div>

<p align="center">
  <br>
  <i>"Redefining human connection, one private conversation at a time."</i><br>
  <b>© 2026 Livetalk. Open Source. MIT License.</b>
</p>
