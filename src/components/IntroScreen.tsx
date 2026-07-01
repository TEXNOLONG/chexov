import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export function IntroScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100)
    const t2 = setTimeout(() => setPhase('out'), 2400)
    const t3 = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: '#0c0a18',
        backgroundImage: `
          radial-gradient(ellipse 80% 55% at 10% 0%, rgba(100,60,220,0.35) 0%, transparent 65%),
          radial-gradient(ellipse 60% 40% at 90% 90%, rgba(200,120,0,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 55% 70% at 55% 40%, rgba(60,30,160,0.18) 0%, transparent 70%)
        `,
        transition: 'opacity 0.6s cubic-bezier(.4,0,.2,1)',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Logo icon */}
      <div
        style={{
          transition: 'all 0.7s cubic-bezier(.34,1.56,.64,1)',
          transform: phase === 'in' ? 'scale(0.5) translateY(20px)' : 'scale(1) translateY(0)',
          opacity: phase === 'in' ? 0 : 1,
        }}
      >
        <div
          className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-6"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 60px rgba(245,180,0,0.40), 0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#0a0806" strokeWidth={2.2} className="w-12 h-12">
            <path d="M3 11l7-7 4 4 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 11v10H3V11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Restaurant name */}
      <div
        style={{
          transition: 'all 0.6s cubic-bezier(.4,0,.2,1) 0.25s',
          transform: phase === 'in' ? 'translateY(24px)' : 'translateY(0)',
          opacity: phase === 'in' ? 0 : 1,
          textAlign: 'center',
        }}
      >
        <div
          className="text-[11px] font-black uppercase tracking-[0.3em] mb-2"
          style={{ color: 'var(--accent)' }}
        >
          Гастропаб
        </div>
        <div
          className="text-4xl font-black tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Чехов
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          transition: 'all 0.5s ease 0.5s',
          opacity: phase === 'in' ? 0 : 0.45,
          marginTop: '0.75rem',
        }}
      >
        <div className="text-sm tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          Ярославль
        </div>
      </div>

      {/* Bottom pulse dots */}
      <div
        className="absolute bottom-16 flex gap-2"
        style={{
          transition: 'opacity 0.4s ease 0.6s',
          opacity: phase === 'in' ? 0 : 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--accent)',
              animation: `pulseDot 1.4s infinite ease-in-out`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
