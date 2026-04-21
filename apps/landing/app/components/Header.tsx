"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header id="header" className={scrolled ? "scrolled" : ""}>
      <div className="wrap">
        <div className="header-inner">
          <a href="#" className="logo">
            <span className="dot"></span>Socially
          </a>
          <nav>
            <div className="links" style={{ display: "flex", gap: 32 }}>
              <a href="#essence">Essence</a>
              <a href="#rules">Rules</a>
              <a href="#journey">Journey</a>
              <a href="#reviews">Reviews</a>
              <a href="#faq">FAQ</a>
            </div>
            <a href="#apply" className="btn-yellow">
              신청하기 →
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
