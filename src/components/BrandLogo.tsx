import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const BrandLogo = ({ className, ...props }: HTMLAttributes<HTMLImageElement>) => (
    <img
        src="/logo.png"
        alt="LiveTalk Logo"
        className={cn("w-8 h-8 object-contain", className)}
        {...props}
    />
);
