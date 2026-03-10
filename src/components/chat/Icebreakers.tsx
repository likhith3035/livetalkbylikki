import { motion } from "framer-motion";
import { Sparkles, MessageSquare, HelpCircle, Laugh } from "lucide-react";

interface Icebreaker {
    text: string;
    icon: React.ReactNode;
    label: string;
}

const ICEBREAKERS: Icebreaker[] = [
    { text: "Hey there! How's your day going? 👋", icon: <MessageSquare className="h-3 w-3" />, label: "Say Hello" },
    { text: "What's the most interesting thing you saw today? 🤔", icon: <HelpCircle className="h-3 w-3" />, label: "Ask Question" },
    { text: "Tell me a random fun fact about yourself! ✨", icon: <Sparkles className="h-3 w-3" />, label: "Fun Fact" },
    { text: "Quick! You've got 5 seconds to tell me a joke! 😂", icon: <Laugh className="h-3 w-3" />, label: "Joke" },
];

interface IcebreakersProps {
    onSelect: (text: string) => void;
    disabled?: boolean;
}

const Icebreakers = ({ onSelect, disabled }: IcebreakersProps) => {
    if (disabled) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-1 px-1">
            {ICEBREAKERS.map((item, idx) => (
                <motion.button
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(item.text)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary/50 border border-border/50 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
                >
                    {item.icon}
                    {item.label}
                </motion.button>
            ))}
        </div>
    );
};

export default Icebreakers;
