interface Props {
  size?: number
  style?: React.CSSProperties
}

export default function AppLogo({ size = 36, style }: Props) {
  const r = Math.round(size * 0.19)
  const fontSize = Math.round(size * 0.4)
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style }}
    >
      <rect width="32" height="32" rx={r} fill="#08080a" />
      <text
        x="50%" y="50%"
        dominantBaseline="central" textAnchor="middle"
        fontFamily="sans-serif" fontWeight="800" fontSize={fontSize}
        letterSpacing="-0.5" fill="#ffffff"
      >DKP</text>
    </svg>
  )
}
