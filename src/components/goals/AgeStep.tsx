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
  const containerHeight = 340;
  const paddingTop = containerHeight / 2 - itemHeight / 2;

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const targetIndex = ages.indexOf(value);
      const scrollPosition = targetIndex * itemHeight;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, ages, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      const scrollTop = scrollRef.current.scrollTop;
      const selectedIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(ages.length - 1, selectedIndex));
      onChange(ages[clampedIndex]);
      
      setTimeout(() => setIsScrolling(false), 100);
    }
  };

  const getStyles = (age: number) => {
    const isSelected = age === value;
    const distance = Math.abs(age - value);
    
    if (isSelected) {
      return { fontSize: '3rem', opacity: 1, fontWeight: 700 };
    } else if (distance === 1) {
      return { fontSize: '2rem', opacity: 0.7, fontWeight: 500 };
    } else if (distance === 2) {
      return { fontSize: '1.5rem', opacity: 0.4, fontWeight: 400 };
    } else {
      return { fontSize: '1.25rem', opacity: 0.25, fontWeight: 400 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 h-full flex flex-col bg-white rounded-3xl mx-4 py-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Quantos anos você tem?
        </h1>
        <p className="text-gray-500 text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {/* Center highlight box */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-20 bg-orange-500 rounded-2xl z-0" />

        <div
          ref={scrollRef}
          className="w-full overflow-y-auto scrollbar-hide relative z-10"
          onScroll={handleScroll}
          style={{ 
            height: containerHeight,
            scrollSnapType: 'y mandatory' 
          }}
        >
          <div style={{ paddingTop, paddingBottom: paddingTop }}>
            {ages.map((age) => {
              const isSelected = age === value;
              const styles = getStyles(age);
              
              return (
                <div
                  key={age}
                  className="flex items-center justify-center cursor-pointer"
                  style={{ 
                    height: itemHeight,
                    scrollSnapAlign: 'center',
                    opacity: styles.opacity,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onChange(age)}
                >
                  <span 
                    className={isSelected ? "text-white" : "text-gray-900"}
                    style={{ 
                      fontSize: styles.fontSize, 
                      fontWeight: styles.fontWeight,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {age}
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
