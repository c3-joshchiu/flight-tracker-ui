import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '@/api';
import type { PriceSnapshot } from '@/Interfaces';

interface Props {
  searchId: string;
  route: string;
  refreshKey?: number;
}

interface ChartPoint {
  label: string;
  economy: number | null;
  business: number | null;
}

function toDollars(cents: number): number {
  return Math.round(cents / 100);
}

/* ── Pure SVG line-chart (no external library) ── */

const CHART_W = 800;
const CHART_H = 320;
const PAD = { top: 16, right: 16, bottom: 64, left: 56 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

interface TooltipState {
  x: number;
  y: number;
  label: string;
  economy: number | null;
  business: number | null;
}

function buildPath(
  data: ChartPoint[],
  field: 'economy' | 'business',
  minVal: number,
  maxVal: number
): string {
  const range = maxVal - minVal || 1;
  const parts: string[] = [];
  let started = false;

  data.forEach((pt, i) => {
    const v = pt[field];
    if (v === null) {
      started = false;
      return;
    }
    const x = PAD.left + (i / Math.max(data.length - 1, 1)) * PLOT_W;
    const y = PAD.top + PLOT_H - ((v - minVal) / range) * PLOT_H;
    parts.push(`${started ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
    started = true;
  });

  return parts.join(' ');
}

function buildDots(
  data: ChartPoint[],
  field: 'economy' | 'business',
  minVal: number,
  maxVal: number
): { cx: number; cy: number; val: number; idx: number }[] {
  const range = maxVal - minVal || 1;
  const dots: { cx: number; cy: number; val: number; idx: number }[] = [];

  data.forEach((pt, i) => {
    const v = pt[field];
    if (v === null) return;
    const cx = PAD.left + (i / Math.max(data.length - 1, 1)) * PLOT_W;
    const cy = PAD.top + PLOT_H - ((v - minVal) / range) * PLOT_H;
    dots.push({ cx, cy, val: v, idx: i });
  });

  return dots;
}

export default function PriceChart({ searchId, route, refreshKey }: Props) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const data: PriceSnapshot[] =
          (await api.prices.history(searchId)) || [];
        setSnapshots(data);
      } catch {
        setSnapshots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchId, refreshKey]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const byTs: Record<string, { economy: number | null; business: number | null; label: string }> =
      {};

    for (const snap of snapshots) {
      const t = new Date(snap.fetchedAt).getTime();
      const key = String(t);
      if (!byTs[key]) {
        const d = new Date(t);
        byTs[key] = {
          economy: null,
          business: null,
          label: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
        };
      }
      byTs[key][snap.seatClass as 'economy' | 'business'] = toDollars(snap.price);
    }

    return Object.entries(byTs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, data]) => data);
  }, [snapshots]);

  /* Compute value bounds across both series */
  const { minVal, maxVal } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const pt of chartData) {
      if (pt.economy !== null) {
        lo = Math.min(lo, pt.economy);
        hi = Math.max(hi, pt.economy);
      }
      if (pt.business !== null) {
        lo = Math.min(lo, pt.business);
        hi = Math.max(hi, pt.business);
      }
    }
    if (!isFinite(lo)) {
      lo = 0;
      hi = 100;
    }
    const padding = Math.max((hi - lo) * 0.1, 10);
    return { minVal: Math.floor(lo - padding), maxVal: Math.ceil(hi + padding) };
  }, [chartData]);

  /* Y-axis ticks */
  const yTicks = useMemo(() => {
    const count = 5;
    const step = (maxVal - minVal) / count;
    return Array.from({ length: count + 1 }, (_, i) => Math.round(minVal + step * i));
  }, [minVal, maxVal]);

  /* X-axis label step */
  const labelStep = useMemo(
    () => Math.max(1, Math.floor(chartData.length / 10)),
    [chartData.length]
  );

  /* Hover handler over the invisible hit-rects */
  const handleHover = useCallback(
    (i: number, x: number, y: number) => {
      const pt = chartData[i];
      if (!pt) return;
      setTooltip({ x, y, label: pt.label, economy: pt.economy, business: pt.business });
    },
    [chartData]
  );

  const pointCount = snapshots.length;

  return (
    <div className="c3-card h-full flex flex-col">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-primary">Price History</h2>
          <p className="text-xs text-secondary">{route} &mdash; each fetch</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-secondary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-3 rounded-full bg-[var(--chart-economy)]" />
            Economy
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-3 rounded-full bg-[var(--chart-business)]" />
            Business
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-secondary">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-secondary">
          No price data yet.
        </div>
      ) : (
        <div className="relative flex-1">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Grid lines & Y-axis labels */}
            {yTicks.map((tick) => {
              const y = PAD.top + PLOT_H - ((tick - minVal) / (maxVal - minVal || 1)) * PLOT_H;
              return (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + PLOT_W}
                    y1={y}
                    y2={y}
                    stroke="var(--c3-style-colorBorderWeak)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={PAD.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={9}
                    fill="var(--c3-style-colorFgSecondary)"
                  >
                    ${tick}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {chartData.map((pt, i) =>
              i % labelStep === 0 ? (
                <text
                  key={i}
                  x={PAD.left + (i / Math.max(chartData.length - 1, 1)) * PLOT_W}
                  y={CHART_H - 4}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--c3-style-colorFgSecondary)"
                  transform={`rotate(-40, ${PAD.left + (i / Math.max(chartData.length - 1, 1)) * PLOT_W}, ${CHART_H - 4})`}
                >
                  {pt.label}
                </text>
              ) : null
            )}

            {/* Economy line */}
            <path
              d={buildPath(chartData, 'economy', minVal, maxVal)}
              fill="none"
              stroke="var(--chart-economy)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {buildDots(chartData, 'economy', minVal, maxVal).map((dot) => (
              <circle
                key={`e-${dot.idx}`}
                cx={dot.cx}
                cy={dot.cy}
                r={3}
                fill="var(--chart-economy)"
              />
            ))}

            {/* Business line */}
            <path
              d={buildPath(chartData, 'business', minVal, maxVal)}
              fill="none"
              stroke="var(--chart-business)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {buildDots(chartData, 'business', minVal, maxVal).map((dot) => (
              <circle
                key={`b-${dot.idx}`}
                cx={dot.cx}
                cy={dot.cy}
                r={3}
                fill="var(--chart-business)"
              />
            ))}

            {/* Invisible hit-rects for tooltip */}
            {chartData.map((_, i) => {
              const x = PAD.left + (i / Math.max(chartData.length - 1, 1)) * PLOT_W;
              const w = PLOT_W / Math.max(chartData.length - 1, 1);
              return (
                <rect
                  key={`hit-${i}`}
                  x={x - w / 2}
                  y={PAD.top}
                  width={w}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseEnter={() => handleHover(i, x, PAD.top)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 rounded bg-foreground/90 px-2 py-1 text-[11px] text-background shadow"
              style={{
                left: `${(tooltip.x / CHART_W) * 100}%`,
                top: `${(tooltip.y / CHART_H) * 100}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="font-medium">{tooltip.label}</div>
              {tooltip.economy !== null && <div>Economy: ${tooltip.economy}</div>}
              {tooltip.business !== null && <div>Business: ${tooltip.business}</div>}
            </div>
          )}
        </div>
      )}

      <p className="mt-1 text-right text-[11px] text-secondary">
        {pointCount} quote{pointCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
