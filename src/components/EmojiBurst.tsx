import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface EmojiBurstProps {
    emoji: string;
    onComplete: () => void;
}

const EmojiBurst = ({ emoji, onComplete }: EmojiBurstProps) => {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; rotate: number }[]>([]);

    useEffect(() => {
        // Generate 6-8 particles for the burst
        const newParticles = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: (Math.random() - 0.5) * 150, // spread
            y: (Math.random() - 0.8) * 150, // mostly upward
            rotate: Math.random() * 360,
        }));
        setParticles(newParticles);

        const timer = setTimeout(onComplete, 1000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.span
                        key={p.id}
                        initial={{ scale: 0, opacity: 1, x: 0, y: 0, rotate: 0 }}
                        animate={{
                            scale: [0, 1.2, 0.8],
                            opacity: [1, 1, 0],
                            x: p.x,
                            y: p.y,
                            rotate: p.rotate
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute text-lg select-none"
                    >
                        {emoji}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default EmojiBurst;
