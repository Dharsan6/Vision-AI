import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  yOffset = 20,
}) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    gsap.set(el, { opacity: 0, y: yOffset });

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power2.out',
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    // Safeguard: Ensure content is never indefinitely hidden
    const timer = setTimeout(() => {
      reveal();
    }, 1200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [delay, duration, yOffset]);

  return (
    <div ref={elRef} className={className}>
      {children}
    </div>
  );
}
