import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  children: React.ReactNode;
  multiple?: boolean;
  className?: string;
}

interface AccordionContextType {
  openValues: string[];
  toggleValue: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export const Accordion = ({ children, multiple = false, className }: AccordionProps) => {
  const [openValues, setOpenValues] = React.useState<string[]>([]);

  const toggleValue = (value: string) => {
    setOpenValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return multiple ? [...prev, value] : [value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openValues, toggleValue }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("rounded-[2rem] bg-card/30 backdrop-blur-sm border border-border/50 overflow-hidden transition-all duration-300 hover:bg-card/50 hover:border-primary/20", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value });
        }
        return child;
      })}
    </div>
  );
};

export const AccordionTrigger = ({ value, children, showArrow = true, className }: { value?: string; children: React.ReactNode; showArrow?: boolean; className?: string }) => {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionTrigger must be used within Accordion");
  
  const isOpen = context.openValues.includes(value!);

  return (
    <button
      onClick={() => context.toggleValue(value!)}
      className={cn(
        "flex w-full items-center justify-between px-6 py-5 text-left font-bold text-foreground transition-all duration-300",
        className
      )}
    >
      <span className="text-lg">{children}</span>
      {showArrow && (
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="rounded-full bg-primary/10 p-1.5 transition-colors group-hover:bg-primary/20"
        >
          <ChevronDown className="h-4 w-4 text-primary" />
        </motion.div>
      )}
    </button>
  );
};

export const AccordionPanel = ({ value, children, keepRendered = false, className }: { value?: string; children: React.ReactNode; keepRendered?: boolean; className?: string }) => {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionPanel must be used within Accordion");
  
  const isOpen = context.openValues.includes(value!);

  return (
    <AnimatePresence initial={false}>
      {(isOpen || keepRendered) && (
        <motion.div
          initial={isOpen ? { height: 0, opacity: 0 } : false}
          animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
          <div className={cn("px-6 pb-6 pt-0 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
