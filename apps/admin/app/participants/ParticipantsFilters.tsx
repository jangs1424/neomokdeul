"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 13,
  border: "1px solid var(--border)",
  borderRadius: 6,
  background: "#fff",
  color: "var(--text)",
  minWidth: 88,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 500,
};

type Props = {
  cohorts: { id: string; slug: string; name: string }[];
};

export function ParticipantsFilters({ cohorts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const [cohort, setCohort] = useState(sp.get("cohort") ?? "all");
  const [gender, setGender] = useState(sp.get("gender") ?? "all");
  const [qLocal, setQLocal] = useState(sp.get("q") ?? "");

  useEffect(() => {
    setCohort(sp.get("cohort") ?? "all");
    setGender(sp.get("gender") ?? "all");
    setQLocal(sp.get("q") ?? "");
  }, [sp]);

  function push(c: string, g: string, q: string) {
    const params = new URLSearchParams();
    if (c && c !== "all") params.set("cohort", c);
    if (g && g !== "all") params.set("gender", g);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal !== (sp.get("q") ?? "")) {
        push(cohort, gender, qLocal);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  function handleCohort(v: string) {
    setCohort(v);
    push(v, gender, qLocal);
  }

  function handleGender(v: string) {
    setGender(v);
    push(cohort, v, qLocal);
  }

  function reset() {
    setCohort("all");
    setGender("all");
    setQLocal("");
    push("all", "all", "");
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-end",
        padding: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <label style={labelStyle}>
        기수
        <select
          value={cohort}
          onChange={(e) => handleCohort(e.target.value)}
          style={selectStyle}
        >
          <option value="all">전체 기수</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        성별
        <select
          value={gender}
          onChange={(e) => handleGender(e.target.value)}
          style={selectStyle}
        >
          <option value="all">전체</option>
          <option value="male">남</option>
          <option value="female">여</option>
        </select>
      </label>

      <label style={{ ...labelStyle, flex: "1 1 180px" }}>
        이름 / 전화번호
        <input
          type="text"
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="검색"
          style={{ ...selectStyle, width: "100%", minWidth: 160 }}
        />
      </label>

      <button
        type="button"
        onClick={reset}
        style={{
          padding: "6px 12px",
          fontSize: 12,
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text-muted)",
          cursor: "pointer",
          height: 32,
        }}
      >
        필터 초기화
      </button>
    </div>
  );
}
