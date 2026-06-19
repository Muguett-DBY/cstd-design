import { useMemo } from "react";
import { Calendar } from "lucide-react";
import type { UsageEvent } from "../hooks/useUsageStats";

const DAY_LABELS = ["一", "", "三", "", "五", "", "日"];
const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildHeatmap(events: UsageEvent[], days: number = 84): { date: string; count: number; level: number }[] {
  const today = startOfDay(new Date());
  const map = new Map<string, number>();
  for (const e of events) {
    const d = startOfDay(new Date(e.timestamp)).toISOString().slice(0, 10);
    map.set(d, (map.get(d) || 0) + 1);
  }
  const result: { date: string; count: number; level: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = map.get(key) || 0;
    let level = 0;
    if (count >= 1) level = 1;
    if (count >= 3) level = 2;
    if (count >= 6) level = 3;
    if (count >= 10) level = 4;
    result.push({ date: key, count, level });
  }
  return result;
}

export function ActivityHeatmap({ events, onClose }: { events: UsageEvent[]; onClose?: () => void }) {
  const heatmap = useMemo(() => buildHeatmap(events, 84), [events]);
  const totalCount = useMemo(() => heatmap.reduce((sum, h) => sum + h.count, 0), [heatmap]);
  const activeDays = useMemo(() => heatmap.filter((h) => h.count > 0).length, [heatmap]);

  if (onClose === undefined) {
    return (
      <div className="activity-heatmap-inline">
        <ActivityHeatmapInner heatmap={heatmap} totalCount={totalCount} activeDays={activeDays} />
      </div>
    );
  }

  return (
    <div className="activity-heatmap-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="活动热力图">
      <div className="activity-heatmap-modal" onClick={(e) => e.stopPropagation()}>
        <ActivityHeatmapInner heatmap={heatmap} totalCount={totalCount} activeDays={activeDays} />
      </div>
    </div>
  );
}

function ActivityHeatmapInner({ heatmap, totalCount, activeDays }: { heatmap: { date: string; count: number; level: number }[]; totalCount: number; activeDays: number }) {
  const monthMarkers: { month: string; index: number }[] = [];
  let lastMonth = -1;
  heatmap.forEach((h, i) => {
    const d = new Date(h.date);
    const month = d.getMonth();
    if (month !== lastMonth) {
      monthMarkers.push({ month: MONTH_LABELS[month], index: i });
      lastMonth = month;
    }
  });

  const weeksCount = Math.ceil(heatmap.length / 7);

  return (
    <>
      <div className="activity-heatmap-header">
        <strong><Calendar size={14} /> 活动热力图（最近 12 周）</strong>
      </div>
      <div className="activity-heatmap-stats">
        <div className="activity-heatmap-stat">
          <span className="activity-heatmap-stat-value">{totalCount}</span>
          <span className="activity-heatmap-stat-label">总活动</span>
        </div>
        <div className="activity-heatmap-stat">
          <span className="activity-heatmap-stat-value">{activeDays}</span>
          <span className="activity-heatmap-stat-label">活跃天数</span>
        </div>
      </div>
      <div className="activity-heatmap-grid-wrapper">
        <div className="activity-heatmap-months">
          {monthMarkers.map((m) => (
            <span key={m.index} style={{ left: `${(m.index / 7) * 14}px` }}>{m.month}</span>
          ))}
        </div>
        <div className="activity-heatmap-content">
          <div className="activity-heatmap-day-labels">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="activity-heatmap-day-label">{d}</span>
            ))}
          </div>
          <div className="activity-heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeksCount}, 12px)` }}>
            {heatmap.map((h) => (
              <div
                key={h.date}
                className={`activity-heatmap-cell level-${h.level}`}
                title={`${h.date}: ${h.count} 次活动`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="activity-heatmap-legend">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`activity-heatmap-cell level-${l}`} />
        ))}
        <span>多</span>
      </div>
    </>
  );
}
