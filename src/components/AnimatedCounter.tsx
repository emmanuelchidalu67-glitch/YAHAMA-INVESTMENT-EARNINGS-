import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
  decimals?: number;
  startFromZero?: boolean;
  highlightOnChange?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  prefix = '₦',
  className = '',
  decimals = 2,
  startFromZero = true,
  highlightOnChange = true,
}) => {
  // Start from 0.00 so it automatically calculates up to the user's current balance
  const [displayValue, setDisplayValue] = useState<number>(startFromZero ? 0 : value);
  const [isIncreased, setIsIncreased] = useState<boolean>(false);
  const prevValueRef = useRef<number>(startFromZero ? 0 : value);
  const animFrameRef = useRef<number | null>(null);
  const isFirstMount = useRef<boolean>(true);

  useEffect(() => {
    if (!isFirstMount.current && value > prevValueRef.current && highlightOnChange) {
      setIsIncreased(true);
      const timer = setTimeout(() => setIsIncreased(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, highlightOnChange]);

  useEffect(() => {
    const startValue = isFirstMount.current && startFromZero ? 0 : prevValueRef.current;
    const endValue = Number(value) || 0;

    isFirstMount.current = false;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth cubic ease-out calculation curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animFrameRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration, startFromZero]);

  const formattedValue = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={`inline-flex items-center transition-all duration-300 font-mono ${
        isIncreased
          ? 'scale-105 text-emerald-500 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
          : ''
      } ${className}`}
    >
      {prefix && <span className="opacity-90 mr-0.5">{prefix}</span>}
      <span>{formattedValue}</span>
    </span>
  );
};
