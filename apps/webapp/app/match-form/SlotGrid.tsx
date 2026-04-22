'use client';

import { useMemo } from 'react';

export interface TimeBlock {
  label: string;
  code: string; // e.g. "09-12"
}

export const TIME_BLOCKS: TimeBlock[] = [
  { label: '아침', code: '09-12' },
  { label: '낮', code: '13-18' },
  { label: '저녁', code: '18-22' },
  { label: '밤', code: '22-02' },
];

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

function parseDateYYYYMMDD(s: string): Date {
  // Treat as local date (YYYY-MM-DD)
  const [y, m, d] = s.split('-').map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
}

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY_KR[d.getDay()]})`;
}

export function enumerateDates(startStr: string, endStr: string): string[] {
  const out: string[] = [];
  const start = parseDateYYYYMMDD(startStr);
  const end = parseDateYYYYMMDD(endStr);
  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    out.push(formatDateYYYYMMDD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

interface Props {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  value: string[];
  onChange: (next: string[]) => void;
  readOnly?: boolean;
}

export function SlotGrid({ startDate, endDate, value, onChange, readOnly }: Props) {
  const dates = useMemo(() => enumerateDates(startDate, endDate), [startDate, endDate]);
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (date: string, block: string) => {
    if (readOnly) return;
    const key = `${date}_${block}`;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next).sort());
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--surface)',
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: 420,
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(90,122,92,0.06)',
                color: 'var(--sub)',
                fontWeight: 500,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              날짜
            </th>
            {TIME_BLOCKS.map((b) => (
              <th
                key={b.code}
                style={{
                  padding: '8px 6px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: '1px solid var(--border)',
                  background: 'rgba(90,122,92,0.06)',
                  color: 'var(--sub)',
                  fontWeight: 500,
                  fontSize: 12,
                  minWidth: 72,
                }}
              >
                <div>{b.label}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{b.code}시</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const d = parseDateYYYYMMDD(date);
            return (
              <tr key={date}>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDayLabel(d)}
                </td>
                {TIME_BLOCKS.map((b) => {
                  const key = `${date}_${b.code}`;
                  const checked = selected.has(key);
                  return (
                    <td
                      key={b.code}
                      style={{
                        padding: 0,
                        borderBottom: '1px solid var(--border)',
                        borderLeft: '1px solid var(--border)',
                        textAlign: 'center',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          minHeight: 44,
                          cursor: readOnly ? 'default' : 'pointer',
                          background: checked ? 'rgba(90,122,92,0.18)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(date, b.code)}
                          disabled={readOnly}
                          style={{ accentColor: 'var(--forest)' }}
                          aria-label={`${date} ${b.label} ${b.code}`}
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
