"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function Reveal({
  children,
  as = "div",
  id,
  className = "",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  const combined = `reveal${shown ? " show" : ""}${className ? ` ${className}` : ""}`;

  return (
    <Tag ref={ref} id={id} className={combined} style={style}>
      {children}
    </Tag>
  );
}
