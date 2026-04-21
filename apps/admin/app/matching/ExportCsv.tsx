"use client";

import type { Application, Matching } from "@neomokdeul/db";

type Props = {
  cohortSlug: string;
  matchings: Matching[];
  appsById: Record<string, Application>;
};

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function ExportCsv({ cohortSlug, matchings, appsById }: Props) {
  function handleClick() {
    if (matchings.length === 0) {
      alert("내보낼 매칭이 없습니다.");
      return;
    }

    const header = [
      "round",
      "male_name",
      "male_phone",
      "female_name",
      "female_phone",
      "score",
      "status",
      "published_at",
    ];

    const rows = matchings
      .filter((m) => m.status !== "superseded")
      .map((m) => {
        const male = appsById[m.maleApplicationId];
        const female = appsById[m.femaleApplicationId];
        return [
          m.round,
          male?.name ?? "",
          male?.phone ?? "",
          female?.name ?? "",
          female?.phone ?? "",
          typeof m.score === "number" ? m.score.toFixed(2) : "",
          m.status,
          m.publishedAt ?? "",
        ];
      });

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    // Prepend BOM so Excel recognizes UTF-8 (Korean names)
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matchings_${cohortSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        padding: "7px 14px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "#fff",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      CSV 내보내기
    </button>
  );
}
