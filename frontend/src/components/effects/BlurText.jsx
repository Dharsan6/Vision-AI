import React, { useEffect, useRef, useState } from 'react';
import './BlurText.css';

/** Lightweight, dependency-free adaptation of the supplied React Bits BlurText. */
export default function BlurText({
  text = '',
  className = '',
  delay = 45,
  stepDuration = 0.55,
  direction = 'top',
  trigger = 'view',
  blur = 8,
  distance = 18,
}) {
  const ref = useRef(null);
  const [active, setActive] = useState(trigger === 'load');

  useEffect(() => {
    if (trigger !== 'view' || !ref.current) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setActive(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trigger]);

  const words = text.split(' ');
  return (
    <span ref={ref} className={`blur-text ${active ? 'is-visible' : ''} ${className}`} aria-label={text}
      style={{ '--blur-text-delay': `${delay}ms`, '--blur-text-duration': `${stepDuration}s`, '--blur-text-blur': `${blur}px`, '--blur-text-distance': `${distance}px`, '--blur-text-axis': direction === 'bottom' ? 'var(--blur-text-distance)' : 'calc(var(--blur-text-distance) * -1)' }}>
      {words.map((word, index) => <span className="blur-text__word" key={`${word}-${index}`} aria-hidden="true" style={{ animationDelay: `${index * delay}ms` }}>{word}{index < words.length - 1 ? '\u00a0' : ''}</span>)}
    </span>
  );
}
