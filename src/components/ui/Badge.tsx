interface Props { children: React.ReactNode; color?: string; bg?: string }

export default function Badge({ children, color = 'var(--text-dim)', bg = 'var(--surface3)' }: Props) {
  return <span style={{ fontSize:11, fontWeight:600, borderRadius:20, padding:'3px 8px', color, background:bg, whiteSpace:'nowrap' }}>{children}</span>
}
