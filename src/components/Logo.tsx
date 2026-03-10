import { SVGProps } from "react";

export const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        {/* Heart Background */}
        <path
            d="M 60 100 
         C 20 70, 5 45, 5 25 
         C 5 5, 30 5, 45 15 
         C 60 25, 60 25, 60 25 
         C 60 25, 60 25, 75 15 
         C 90 5, 115 5, 115 25 
         C 115 45, 100 70, 60 100 
         Z"
            className="fill-destructive/20 dark:fill-destructive/30"
        />

        <g transform="translate(10, 10)">
            {/* Left Bubble (Primary color) */}
            <path
                d="M 28 20 L 52 20 A 8 8 0 0 1 60 28 L 60 42 A 8 8 0 0 1 52 50 L 26 50 L 12 60 L 20 42 L 20 28 A 8 8 0 0 1 28 20 Z"
                className="fill-primary text-foreground"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinejoin="round"
            />

            {/* Right Bubble (Warning/Yellow color) */}
            <path
                d="M 53 35 L 77 35 A 8 8 0 0 1 85 43 L 85 57 L 93 75 L 79 65 L 53 65 A 8 8 0 0 1 45 57 L 45 43 A 8 8 0 0 1 53 35 Z"
                className="fill-warning text-foreground"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinejoin="round"
            />

            {/* Dots inside right bubble */}
            <circle cx="53" cy="50" r="2.5" fill="currentColor" />
            <circle cx="61" cy="50" r="2.5" fill="currentColor" />
            <circle cx="69" cy="50" r="2.5" fill="currentColor" />
            <circle cx="77" cy="50" r="2.5" fill="currentColor" />
        </g>
    </svg>
);
