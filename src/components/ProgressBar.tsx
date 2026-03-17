const PROGRESS_BLOCKS = 20;

function progressColor(pct: number): string {
  const r = pct < 50 ? 255 : Math.round(255 - (pct - 50) * 5.1);
  const g = pct < 50 ? Math.round(pct * 5.1) : 255;
  return `rgb(${r}, ${g}, 40)`;
}

export default function ProgressBar({ progress }: { progress: number }) {
  const filled = Math.round((progress / 100) * PROGRESS_BLOCKS);
  const empty = PROGRESS_BLOCKS - filled;
  const color = progressColor(progress);

  return (
    <div className="weight-progress">
      <div className="weight-progress__bar">
        <span style={{ color }}>{"█".repeat(filled)}</span>
        <span className="weight-progress__empty">{"░".repeat(empty)}</span>
      </div>
      <span className="weight-progress__pct" style={{ color }}>{progress}%</span>
    </div>
  );
}
