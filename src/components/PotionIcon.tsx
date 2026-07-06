interface Props {
  type: "health" | "mana";
  size?: number;
}

export function PotionIcon({ type, size = 20 }: Props) {
  const liquid = type === "health" ? "#cc2222" : "#2255cc";
  const shine  = type === "health" ? "#ff6666" : "#66aaff";
  const cork   = "#8b6914";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 24"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {/* Cork */}
      <rect x="7" y="1" width="6" height="3.5" rx="1" fill={cork} />
      {/* Neck */}
      <rect x="8" y="4.5" width="4" height="4" fill={liquid} opacity="0.7" />
      {/* Bottle body outline */}
      <path
        d="M8 8.5 C4 9.5 2 12 2 15.5 C2 20 5.5 23 10 23 C14.5 23 18 20 18 15.5 C18 12 16 9.5 12 8.5 Z"
        fill={liquid}
      />
      {/* Liquid level (slightly lighter fill for depth) */}
      <path
        d="M8 11 C5 12 3.5 13.5 3.5 15.5 C3.5 19 6.5 21.5 10 21.5 C13.5 21.5 16.5 19 16.5 15.5 C16.5 13.5 15 12 12 11 Z"
        fill={shine}
        opacity="0.35"
      />
      {/* Shine streak */}
      <path
        d="M7 12 Q6 14 6.5 16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Neck outline */}
      <rect x="8" y="4.5" width="4" height="4" fill="none" stroke={liquid} strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}
