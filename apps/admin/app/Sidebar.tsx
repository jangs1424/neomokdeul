"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  key: string;
};

const nav: NavItem[] = [
  { href: "/", label: "대시보드", key: "dashboard" },
  { href: "/applications", label: "신청 관리", key: "applications" },
  { href: "/cohorts", label: "기수 관리", key: "cohorts" },
  { href: "/messages", label: "문자 발송", key: "messages" },
  { href: "/matching", label: "매칭 실행", key: "matching" },
  { href: "/participants", label: "참가자", key: "participants" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: "var(--warning)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 9999,
        marginLeft: "auto",
        lineHeight: 1.2,
      }}
    >
      {count}
    </span>
  );
}

function NavList({
  pathname,
  pendingCount,
  onClick,
}: {
  pathname: string;
  pendingCount: number;
  onClick?: () => void;
}) {
  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "12px 12px",
      }}
    >
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <a
            key={item.key}
            href={item.href}
            onClick={onClick}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--text)",
              background: active ? "var(--sidebar-active)" : "transparent",
              fontWeight: active ? 600 : 400,
              transition: "background 120ms",
            }}
          >
            <span>{item.label}</span>
            {item.key === "applications" && <Badge count={pendingCount} />}
          </a>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div
      style={{
        padding: "20px 20px 16px",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "var(--text)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      Socially · Admin
    </div>
  );
}

export function Sidebar({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // Close drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  if (!isMobile) {
    // Desktop: fixed left sidebar (reserved via flex, so use sticky within flex row)
    return (
      <aside
        style={{
          width: 240,
          minWidth: 240,
          minHeight: "100vh",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <Logo />
        <NavList pathname={pathname} pendingCount={pendingCount} />
      </aside>
    );
  }

  // Mobile: top bar + drawer overlay
  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--sidebar-bg)",
          borderBottom: "1px solid var(--border)",
          width: "100%",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
          Socially · Admin
        </span>
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setMobileOpen(true)}
          style={{
            padding: "6px 10px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          ☰
        </button>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17, 24, 39, 0.4)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 180ms",
          zIndex: 50,
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 200ms ease-out",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            Socially · Admin
          </span>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMobileOpen(false)}
            style={{
              padding: "4px 8px",
              background: "transparent",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ×
          </button>
        </div>
        <NavList
          pathname={pathname}
          pendingCount={pendingCount}
          onClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
