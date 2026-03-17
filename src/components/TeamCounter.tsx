import { formatNumber } from "@/lib/format";

export default function TeamCounter({
  totalKg,
  label,
  sublabel,
}: {
  totalKg: number;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="team-counter">
      <div className="counter">
        <div className="counter__row">
          <span className="counter__number counter__number--desktop">
            {formatNumber(totalKg, 9)}
          </span>
          <span className="counter__number counter__number--mobile">
            {formatNumber(totalKg, 6)}
          </span>
          <span className="counter__unit">KG</span>
        </div>
        <span className="counter__label">{label ?? "total fat burned by team"}</span>
      </div>
      {sublabel && <p className="team-counter__sublabel">{sublabel}</p>}
    </div>
  );
}
