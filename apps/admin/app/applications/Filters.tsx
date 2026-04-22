"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export type FiltersState = {
  status: string;
  gender: string;
  region: string;
  mbti: string;
  birthFrom: string;
  birthTo: string;
  q: string;
};

function readState(sp: URLSearchParams): FiltersState {
  return {
    status: sp.get("status") ?? "all",
    gender: sp.get("gender") ?? "all",
    region: sp.get("region") ?? "all",
    mbti: sp.get("mbti") ?? "all",
    birthFrom: sp.get("birthFrom") ?? "",
    birthTo: sp.get("birthTo") ?? "",
    q: sp.get("q") ?? "",
  };
}

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

export function Filters({ regions }: { regions: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  // Local state mirror so inputs feel responsive
  const [state, setState] = useState<FiltersState>(() => readState(new URLSearchParams(sp.toString())));

  // Sync if URL changes externally (e.g. cohort tab click)
  useEffect(() => {
    setState(readState(new URLSearchParams(sp.toString())));
  }, [sp]);

  const currentCohort = sp.get("cohort");

  // Debounced push to URL for search field
  const [qLocal, setQLocal] = useState(state.q);
  useEffect(() => setQLocal(state.q), [state.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal !== state.q) {
        pushState({ ...state, q: qLocal });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  function pushState(next: FiltersState) {
    const params = new URLSearchParams();
    if (currentCohort) params.set("cohort", currentCohort);
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (next.gender && next.gender !== "all") params.set("gender", next.gender);
    if (next.region && next.region !== "all") params.set("region", next.region);
    if (next.mbti && next.mbti !== "all") params.set("mbti", next.mbti);
    if (next.birthFrom) params.set("birthFrom", next.birthFrom);
    if (next.birthTo) params.set("birthTo", next.birthTo);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function update<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    const next = { ...state, [key]: value };
    setState(next);
    if (key !== "q") pushState(next);
  }

  function reset() {
    const blank: FiltersState = {
      status: "all",
      gender: "all",
      region: "all",
      mbti: "all",
      birthFrom: "",
      birthTo: "",
      q: "",
    };
    setState(blank);
    setQLocal("");
    pushState(blank);
  }

  const uniqueRegions = useMemo(() => Array.from(new Set(regions)).filter(Boolean).sort(), [regions]);

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
        성별
        <select
          value={state.gender}
          onChange={(e) => update("gender", e.target.value)}
          style={selectStyle}
        >
          <option value="all">전체</option>
          <option value="male">남</option>
          <option value="female">여</option>
        </select>
      </label>
      <label style={labelStyle}>
        지역
        <select
          value={state.region}
          onChange={(e) => update("region", e.target.value)}
          style={selectStyle}
        >
          <option value="all">전체</option>
          {uniqueRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        MBTI
        <select
          value={state.mbti}
          onChange={(e) => update("mbti", e.target.value)}
          style={selectStyle}
        >
          <option value="all">전체</option>
          {MBTI_TYPES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        년생 (from)
        <input
          type="number"
          value={state.birthFrom}
          onChange={(e) => update("birthFrom", e.target.value)}
          placeholder="1990"
          style={{ ...selectStyle, width: 90 }}
        />
      </label>
      <label style={labelStyle}>
        년생 (to)
        <input
          type="number"
          value={state.birthTo}
          onChange={(e) => update("birthTo", e.target.value)}
          placeholder="2000"
          style={{ ...selectStyle, width: 90 }}
        />
      </label>
      <label style={{ ...labelStyle, flex: "1 1 180px" }}>
        이름 / 전화
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
