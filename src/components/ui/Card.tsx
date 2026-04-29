import { useState, CSSProperties } from 'react'

interface Props {
  children: React.ReactNode
  style?: CSSProperties
  hover?: boolean
  delay?: number
  animate?: boolean
}

export default function Card({ children, style = {}, hover = true, delay = 0, animate = true }: Props) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${hov ? 'var(--border-light)' : 'var(--border)'}`,
        borderRadius: 16, padding: 20,
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        animation: animate ? `slideUp 0.5s ease both ${delay}s` : 'none',
        ...style,
      }}>
      {children}
    </div>
  )
}
