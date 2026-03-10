import { motion } from "framer-motion";

const MeshBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background pointer-events-none">
            {/* Primary Blob */}
            <motion.div
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full opacity-[0.15] blur-[100px]"
                style={{ backgroundColor: `hsl(var(--mesh-blob-1, var(--primary)))` }}
            />

            {/* Secondary Blob */}
            <motion.div
                animate={{
                    x: [0, -100, 50, 0],
                    y: [0, 100, -50, 0],
                    scale: [1, 0.8, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -bottom-[10%] -right-[10%] h-[70%] w-[70%] rounded-full opacity-[0.12] blur-[120px]"
                style={{ backgroundColor: `hsl(var(--mesh-blob-2, var(--primary)))` }}
            />

            {/* Tertiary Blob (Accent) */}
            <motion.div
                animate={{
                    x: [0, 80, -80, 0],
                    y: [0, 80, -80, 0],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[20%] left-[30%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[80px]"
            />

            {/* Subtle Grain Overlay for texture */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};

export default MeshBackground;
