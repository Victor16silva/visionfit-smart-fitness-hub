import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function HeightStep({ value, onChange }: HeightStepProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heights = Array.from({ length: 81 }, (_, i) => i + 140); // 140-220 cm
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const itemHeight = 40;
      const targetIndex = heights.indexOf(value);
      const scrollPosition = targetIndex * itemHeight - scrollRef.current.clientHeight / 2 + itemHeight / 2;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, heights, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      const itemHeight = 40;
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
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é sua altura?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="flex items-center justify-center gap-8">
        {/* Height display */}
        <motion.div 
          className="text-center"
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="text-6xl font-black text-lime">{value}</span>
          <span className="text-xl text-muted-foreground ml-1">cm</span>
        </motion.div>

        {/* Ruler picker */}
        <div className="relative h-[280px] w-24">
          {/* Gradient overlays */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          
          {/* Center highlight */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-lime/20 rounded-lg border-l-4 border-lime z-0" />

          <div
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-hide"
            onScroll={handleScroll}
          >
            <div className="py-[120px]">
              {heights.map((height) => {
                const isSelected = height === value;
                const distance = Math.abs(height - value);
                const opacity = distance === 0 ? 1 : distance <= 2 ? 0.6 : distance <= 4 ? 0.3 : 0.15;
                
                return (
                  <motion.div
                    key={height}
                    className="h-[40px] flex items-center justify-end pr-2 cursor-pointer"
                    onClick={() => onChange(height)}
                    style={{ opacity }}
                  >
                    <div className={`flex items-center gap-2 ${
                      height % 5 === 0 ? "" : ""
                    }`}>
                      <span className={`text-lg font-bold transition-colors ${
                        isSelected ? "text-lime" : "text-foreground"
                      }`}>
                        {height}
                      </span>
                      <div className={`h-0.5 transition-all ${
                        isSelected ? "w-8 bg-lime" : height % 5 === 0 ? "w-6 bg-muted-foreground" : "w-3 bg-muted"
                      }`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
