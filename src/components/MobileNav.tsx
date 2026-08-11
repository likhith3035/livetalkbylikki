import { useState, useEffect, useRef } from "react";
import { Home, MessageSquare, User, Settings, Info, X, Smartphone, Shield, ShieldAlert, Menu, Bot, Wand2, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import ApkDownloadButton from "@/components/ApkDownloadButton";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home,          path: "/",                 label: "Home Page",       accent: "#10b981" },
  { icon: MessageSquare, path: "/chat",              label: "Start Chat",      accent: "hsl(var(--primary))" },
  { icon: Bot,           path: "/ai-chat",           label: "AI Wingman",      accent: "#ec4899" },
  { icon: Wand2,         path: "/prompt-analyzer",   label: "Prompt Analyzer", accent: "#a855f7" },
  { icon: Share2,        path: "/file-sharing",      label: "File Sharing",    accent: "#3b82f6" },
  { icon: Shield,        path: "/safety",            label: "Safety Center",   accent: "#14b8a6" },
  { icon: User,          path: "/profile",           label: "My Profile",      accent: "#8b5cf6" },
  { icon: Settings,      path: "/settings",          label: "App Settings",    accent: "#64748b" },
  { icon: ShieldAlert,   path: "/guidelines",        label: "Community Rules", accent: "#f59e0b" },
  { icon: Info,          path: "/info",              label: "Help & FAQ",      accent: "#0ea5e9" },
];


export default function MobileNav() {
  // Mobile navigation is now seamlessly provided by the Top Header Hamburger Menu (☰) slide-out drawer
  return null;
}
