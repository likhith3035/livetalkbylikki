import { Lock, ListFilter, EyeOff } from "lucide-react";

const features = [
  { icon: Lock, label: "ENCRYPTED" },
  { icon: ListFilter, label: "AUTO-DELETE" },
  { icon: EyeOff, label: "PRIVATE" },
];

const FeatureBadges = () => {
  return (
    <div className="flex gap-4 justify-center">
      {features.map((f) => (
        <div
          key={f.label}
          className="flex flex-col items-center gap-2 rounded-lg bg-secondary/60 border border-border px-6 py-4 min-w-[100px]"
        >
          <f.icon className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-medium tracking-widest text-muted-foreground">
            {f.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeatureBadges;
