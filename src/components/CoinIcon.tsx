interface Props {
  size?: number;
}

export function CoinIcon({ size = 16 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {/* Outer coin ring */}
      <circle cx="8" cy="8" r="7" fill="#b8860b" stroke="#f0c040" strokeWidth="1" />
      {/* Inner face */}
      <circle cx="8" cy="8" r="5.2" fill="#d4a017" />
      {/* Highlight */}
      <ellipse cx="6.2" cy="5.8" rx="1.6" ry="1" fill="#f8e060" opacity="0.55" transform="rotate(-30 6.2 5.8)" />
      {/* "G" mark */}
      <text
        x="8"
        y="11"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fontFamily="serif"
        fill="#7a5200"
        style={{ userSelect: "none" }}
      >
        G
      </text>
    </svg>
  );
}
