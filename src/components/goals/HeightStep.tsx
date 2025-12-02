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
  const itemHeight = 48;

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

  const getStyles = (height: number) => {
    const isSelected = height === value;
    const distance = Math.abs(height - value);
    
    if (isSelected) {
      return { fontSize: '3rem', opacity: 1, fontWeight: 700 };
    } else if (distance === 1) {
      return { fontSize: '1.75rem', opacity: 0.9, fontWeight: 500 };
    } else if (distance === 2) {
      return { fontSize: '1.25rem', opacity: 0.6, fontWeight: 400 };
    } else if (distance === 3) {
      return { fontSize: '1rem', opacity: 0.4, fontWeight: 400 };
    } else {
      return { fontSize: '0.875rem', opacity: 0.25, fontWeight: 400 };
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
        {/* Selection indicator lines */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-48 pointer-events-none z-20">
          <div className="absolute -top-[26px] w-full h-[2px] bg-[#dc2626]" />
          <div className="absolute top-[26px] w-full h-[2px] bg-[#dc2626]" />
        </div>

        <div
          ref={scrollRef}
          className="h-[340px] w-full overflow-y-auto scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div style={{ paddingTop: '146px', paddingBottom: '146px' }}>
            {heights.map((height) => {
              const isSelected = height === value;
              const styles = getStyles(height);
              
              return (
                <div
                  key={height}
                  className="flex items-center justify-center cursor-pointer"
                  style={{ 
                    height: itemHeight,
                    scrollSnapAlign: 'center',
                    opacity: styles.opacity,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onChange(height)}
                >
                  <span 
                    className="text-white flex items-baseline"
                    style={{ 
                      fontSize: styles.fontSize, 
                      fontWeight: styles.fontWeight,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {height}
                    {isSelected && (
                      <span className="text-base text-white/70 font-normal ml-1">cm</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
