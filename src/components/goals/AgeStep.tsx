import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface AgeStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function AgeStep({ value, onChange }: AgeStepProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ages = Array.from({ length: 83 }, (_, i) => i + 13); // 13-95
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const itemHeight = 60;
      const targetIndex = ages.indexOf(value);
      const scrollPosition = targetIndex * itemHeight - scrollRef.current.clientHeight / 2 + itemHeight / 2;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, ages, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      const itemHeight = 60;
      const scrollTop = scrollRef.current.scrollTop;
      const centerPosition = scrollTop + scrollRef.current.clientHeight / 2;
      const selectedIndex = Math.round((centerPosition - itemHeight / 2) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(ages.length - 1, selectedIndex));
      onChange(ages[clampedIndex]);
      
      setTimeout(() => setIsScrolling(false), 100);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Quantos anos você tem?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="relative h-[300px] flex items-center justify-center">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Center highlight */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-16 bg-lime/20 rounded-xl border-2 border-lime z-0" />

        <div
          ref={scrollRef}
          className="h-full w-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="py-[120px]">
            {ages.map((age) => {
              const isSelected = age === value;
              const distance = Math.abs(age - value);
              const opacity = distance === 0 ? 1 : distance === 1 ? 0.6 : distance === 2 ? 0.3 : 0.15;
              const scale = distance === 0 ? 1.2 : distance === 1 ? 1 : 0.9;
              
              return (
                <motion.div
                  key={age}
                  className="h-[60px] flex items-center justify-center snap-center cursor-pointer"
                  onClick={() => onChange(age)}
                  style={{ opacity }}
                  animate={{ scale }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={`text-4xl font-black transition-colors ${
                    isSelected ? "text-lime" : "text-foreground"
                  }`}>
                    {age}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-5xl font-black text-lime">{value}</span>
        <span className="text-xl text-muted-foreground ml-2">anos</span>
      </div>
    </motion.div>
  );
}
