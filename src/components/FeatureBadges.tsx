import { Lock, ListFilter, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Lock, label: "ENCRYPTED", desc: "End-to-end secure" },
  { icon: ListFilter, label: "AUTO-DELETE", desc: "Chats vanish on exit" },
  { icon: EyeOff, label: "PRIVATE", desc: "No data stored" },
];

const FeatureBadges = () => {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {features.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 border border-border/50 px-5 py-3 min-w-[90px]"
        >
          <f.icon className="h-5 w-5 text-primary/70" />
          <span className="text-[10px] font-semibold tracking-widest text-foreground/70">
            {f.label}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">{f.desc}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default FeatureBadges;
