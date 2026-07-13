interface Props {
  size?: number;
}

export function CoinIcon({ size = 16 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      {/* Outer edge */}
      <circle cx="8" cy="8" r="7.2" fill="#7a5000" />
      {/* Main face */}
      <circle cx="8" cy="8" r="6" fill="#c8880e" />
      {/* Inner ring */}
      <circle
        cx="8"
        cy="8"
        r="4.4"
        fill="none"
        stroke="#e8a820"
        strokeWidth="0.9"
      />
    </svg>
  );
}
