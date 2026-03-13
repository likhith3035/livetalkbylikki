import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: HTMLAttributes<SVGSVGElement>) => (
    <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="LiveTalk Logo"
        className={cn("w-8 h-8", className)}
        {...(props as any)}
    >
        <defs>
            <linearGradient id="purpleGradient" x1="20" y1="20" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9333ea" />
                <stop offset="1" stopColor="#7e22ce" />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="45" y1="35" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Faded Heart Background */}
        <path
            d="M 60 100 
               C 20 70, 5 45, 5 25 
               C 5 5, 30 5, 45 15 
               C 60 25, 60 25, 60 25 
               C 60 25, 60 25, 75 15 
               C 90 5, 115 5, 115 25 
               C 115 45, 100 70, 60 100 
               Z"
            fill="currentColor"
            fillOpacity="0.08"
            className="text-destructive"
        />

        {/* Main Purple Bubble */}
        <path
            d="M 28 20 L 52 20 A 8 8 0 0 1 60 28 L 60 42 A 8 8 0 0 1 52 50 L 26 50 L 12 60 L 20 42 L 20 28 A 8 8 0 0 1 28 20 Z"
            fill="url(#purpleGradient)"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#glow)"
        />

        {/* Overlapping Orange Bubble */}
        <path
            d="M 53 35 L 77 35 A 8 8 0 0 1 85 43 L 85 57 L 93 75 L 79 65 L 53 65 A 8 8 0 0 1 45 57 L 45 43 A 8 8 0 0 1 53 35 Z"
            fill="url(#orangeGradient)"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#glow)"
        />

        {/* Interaction dots in the orange bubble */}
        <circle cx="58" cy="50" r="1.5" fill="white" fillOpacity="0.8" />
        <circle cx="65" cy="50" r="1.5" fill="white" fillOpacity="0.8" />
        <circle cx="72" cy="50" r="1.5" fill="white" fillOpacity="0.8" />
    </svg>
);
