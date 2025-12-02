import { motion } from "framer-motion";
import { useRef, useCallback } from "react";

interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function HeightStep({ value, onChange }: HeightStepProps) {
  const minHeight = 140;
  const maxHeight = 220;
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Calculate angle from value (0 = left side, 180 = right side)
  const valueToAngle = (val: number) => {
    const progress = (val - minHeight) / (maxHeight - minHeight);
    return 180 - progress * 180;
  };

  const angleToValue = (angle: number) => {
    const progress = (180 - angle) / 180;
    return Math.round(minHeight + progress * (maxHeight - minHeight));
  };

  const calculateAngleFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return valueToAngle(value);
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height;
    
    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = Math.max(0, Math.min(180, angle));
    
    return angle;
  }, [value]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    const angle = calculateAngleFromPosition(e.clientX, e.clientY);
    onChange(angleToValue(angle));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const angle = calculateAngleFromPosition(e.clientX, e.clientY);
    onChange(angleToValue(angle));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const currentAngle = valueToAngle(value);
  const arcRadius = 140;
  const handleX = Math.cos(currentAngle * Math.PI / 180) * arcRadius;
  const handleY = -Math.sin(currentAngle * Math.PI / 180) * arcRadius;

  const ticks = Array.from({ length: 17 }, (_, i) => {
    const tickAngle = 180 - (i * 180 / 16);
    const innerRadius = i % 2 === 0 ? 115 : 125;
    const outerRadius = 135;
    
    return {
      x1: Math.cos(tickAngle * Math.PI / 180) * innerRadius,
      y1: -Math.sin(tickAngle * Math.PI / 180) * innerRadius,
      x2: Math.cos(tickAngle * Math.PI / 180) * outerRadius,
      y2: -Math.sin(tickAngle * Math.PI / 180) * outerRadius,
      isMajor: i % 2 === 0,
    };
  });

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
          Arraste para ajustar
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          ref={containerRef}
          className="relative w-80 h-44 cursor-pointer touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <svg viewBox="-160 -150 320 160" className="w-full h-full overflow-visible">
            <path
              d={`M -${arcRadius} 0 A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius} 0`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/30"
            />
            
            <path
              d={`M -${arcRadius} 0 A ${arcRadius} ${arcRadius} 0 0 1 ${handleX} ${handleY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-lime"
              strokeLinecap="round"
            />
            
            {ticks.map((tick, i) => (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 2 : 1}
                className="text-muted-foreground/50"
              />
            ))}
            
            <motion.g
              animate={{ x: handleX, y: handleY }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <circle cx={0} cy={0} r={16} className="fill-lime" />
              <circle cx={0} cy={0} r={8} className="fill-background" />
            </motion.g>
            
            <motion.line
              x1={0}
              y1={0}
              animate={{ x2: handleX * 0.7, y2: handleY * 0.7 }}
              stroke="currentColor"
              strokeWidth="3"
              className="text-lime"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <motion.div 
          className="text-center mt-8"
          key={value}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="text-7xl font-black text-foreground">{value}</span>
          <span className="text-2xl text-muted-foreground ml-2">cm</span>
        </motion.div>

        <div className="flex justify-between w-72 mt-4 text-sm text-muted-foreground">
          <span>{minHeight} cm</span>
          <span>{maxHeight} cm</span>
        </div>
      </div>
    </motion.div>
  );
}
