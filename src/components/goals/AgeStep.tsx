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
  const itemHeight = 64;

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const targetIndex = ages.indexOf(value);
      const scrollPosition = targetIndex * itemHeight - scrollRef.current.clientHeight / 2 + itemHeight / 2;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, ages, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
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

      <div className="relative h-[340px] flex items-center justify-center">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Center highlight box */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-28 h-16 bg-lime/10 rounded-xl border-2 border-lime z-0" />

        <div
          ref={scrollRef}
          className="h-full w-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="py-[140px]">
            {ages.map((age) => {
              const isSelected = age === value;
              const distance = age - value; // positive = below selected, negative = above
              
              // Selected is white and prominent inside the box
              // Values below get larger and more lime colored
              // Values above get smaller and faded
              let fontSize = '1.5rem';
              let opacity = 0.3;
              let fontWeight = 500;
              let color = 'text-foreground';
              
              if (isSelected) {
                fontSize = '3rem';
                opacity = 1;
                fontWeight = 800;
                color = 'text-foreground';
              } else if (distance === 1) {
                fontSize = '2.5rem';
                opacity = 0.7;
                fontWeight = 700;
                color = 'text-lime/70';
              } else if (distance === 2) {
                fontSize = '3rem';
                opacity = 0.9;
                fontWeight = 800;
                color = 'text-lime';
              } else if (distance >= 3) {
                fontSize = '2.5rem';
                opacity = 0;
              } else if (distance === -1) {
                fontSize = '2.25rem';
                opacity = 0.5;
                fontWeight = 600;
              } else if (distance === -2) {
                fontSize = '2rem';
                opacity = 0.3;
              } else if (distance <= -3) {
                fontSize = '1.75rem';
                opacity = 0.15;
              }
              
              return (
                <motion.div
                  key={age}
                  className="flex items-center justify-center snap-center cursor-pointer"
                  style={{ height: itemHeight }}
                  onClick={() => onChange(age)}
                  animate={{ opacity }}
                  transition={{ duration: 0.15 }}
                >
                  <span 
                    className={`transition-all duration-150 ${color}`}
                    style={{ fontSize, fontWeight }}
                  >
                    {age}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
