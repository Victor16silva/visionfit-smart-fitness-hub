import { motion } from "framer-motion";
import { useRef, useEffect } from "react";

interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function HeightStep({ value, onChange }: HeightStepProps) {
  const minHeight = 140;
  const maxHeight = 220;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 56;

  const heights = Array.from(
    { length: maxHeight - minHeight + 1 },
    (_, i) => minHeight + i
  );

  useEffect(() => {
    if (containerRef.current) {
      const index = value - minHeight;
      const scrollPosition = index * itemHeight - (containerRef.current.clientHeight / 2) + (itemHeight / 2);
      containerRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const centerOffset = containerRef.current.clientHeight / 2;
      const index = Math.round((scrollTop + centerOffset - itemHeight / 2) / itemHeight);
      const newValue = Math.max(minHeight, Math.min(maxHeight, minHeight + index));
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const scrollToValue = (targetValue: number) => {
    if (containerRef.current) {
      const index = targetValue - minHeight;
      const scrollPosition = index * itemHeight - (containerRef.current.clientHeight / 2) + (itemHeight / 2);
      containerRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
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

      <div className="flex-1 flex items-center justify-center relative">
        {/* Selection indicator lines */}
        <div className="absolute left-1/2 -translate-x-1/2 w-48 pointer-events-none z-10">
          <div className="absolute top-1/2 -translate-y-[28px] w-full h-0.5 bg-destructive" />
          <div className="absolute top-1/2 translate-y-[28px] w-full h-0.5 bg-destructive" />
        </div>

        {/* Scroll container */}
        <div
          ref={containerRef}
          className="h-[280px] overflow-y-auto scrollbar-hide relative"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {/* Top padding */}
          <div style={{ height: '112px' }} />
          
          {heights.map((height) => {
            const isSelected = height === value;
            const distance = Math.abs(height - value);
            
            let opacity = 0.2;
            let scale = 0.7;
            let fontWeight = 300;
            
            if (isSelected) {
              opacity = 1;
              scale = 1;
              fontWeight = 700;
            } else if (distance === 1) {
              opacity = 0.6;
              scale = 0.85;
              fontWeight = 500;
            } else if (distance === 2) {
              opacity = 0.4;
              scale = 0.75;
            } else if (distance === 3) {
              opacity = 0.3;
              scale = 0.7;
            }

            return (
              <motion.div
                key={height}
                className="flex items-center justify-center cursor-pointer"
                style={{ 
                  height: itemHeight,
                  scrollSnapAlign: 'center'
                }}
                onClick={() => scrollToValue(height)}
                animate={{ opacity, scale }}
                transition={{ duration: 0.15 }}
              >
                <span 
                  className="text-foreground flex items-baseline gap-1"
                  style={{ 
                    fontSize: isSelected ? '4rem' : '2rem',
                    fontWeight 
                  }}
                >
                  {height}
                  {isSelected && (
                    <span className="text-2xl text-muted-foreground font-normal">cm</span>
                  )}
                </span>
              </motion.div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: '112px' }} />
        </div>
      </div>
    </motion.div>
  );
}
