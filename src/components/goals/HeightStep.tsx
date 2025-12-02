import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function HeightStep({ value, onChange }: HeightStepProps) {
  const minHeight = 140;
  const maxHeight = 220;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const itemHeight = 56;

  const heights = Array.from(
    { length: maxHeight - minHeight + 1 },
    (_, i) => minHeight + i
  );

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const targetIndex = heights.indexOf(value);
      const scrollPosition = targetIndex * itemHeight - scrollRef.current.clientHeight / 2 + itemHeight / 2;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, heights, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      const scrollTop = scrollRef.current.scrollTop;
      const centerPosition = scrollTop + scrollRef.current.clientHeight / 2;
      const selectedIndex = Math.round((centerPosition - itemHeight / 2) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(heights.length - 1, selectedIndex));
      onChange(heights[clampedIndex]);
      
      setTimeout(() => setIsScrolling(false), 100);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é sua altura?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Selection indicator lines */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-64 pointer-events-none z-20">
          <div className="absolute -top-7 w-full h-0.5 bg-destructive" />
          <div className="absolute top-7 w-full h-0.5 bg-destructive" />
        </div>

        <div
          ref={scrollRef}
          className="h-[320px] w-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="py-[140px]">
            {heights.map((height) => {
              const isSelected = height === value;
              const distance = height - value; // positive = below selected, negative = above
              
              // Values below selected get progressively larger
              // Selected value is medium, values above are smaller
              let fontSize = '1.5rem';
              let opacity = 0.3;
              let fontWeight = 400;
              
              if (isSelected) {
                fontSize = '2rem';
                opacity = 1;
                fontWeight = 700;
              } else if (distance === 1) {
                fontSize = '2.5rem';
                opacity = 0.8;
                fontWeight = 700;
              } else if (distance === 2) {
                fontSize = '3.5rem';
                opacity = 1;
                fontWeight = 800;
              } else if (distance >= 3) {
                fontSize = '4rem';
                opacity = 0;
              } else if (distance === -1) {
                fontSize = '1.75rem';
                opacity = 0.6;
                fontWeight = 500;
              } else if (distance === -2) {
                fontSize = '1.5rem';
                opacity = 0.4;
              } else if (distance <= -3) {
                fontSize = '1.25rem';
                opacity = 0.2;
              }
              
              return (
                <motion.div
                  key={height}
                  className="flex items-center justify-center snap-center cursor-pointer"
                  style={{ height: itemHeight }}
                  onClick={() => onChange(height)}
                  animate={{ opacity }}
                  transition={{ duration: 0.15 }}
                >
                  <span 
                    className="text-foreground flex items-baseline gap-1 transition-all duration-150"
                    style={{ fontSize, fontWeight }}
                  >
                    {height}
                    {distance === 2 && (
                      <span className="text-xl text-muted-foreground font-normal">cm</span>
                    )}
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
