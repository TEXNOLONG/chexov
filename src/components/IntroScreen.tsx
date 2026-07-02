import { useEffect, useState } from 'react'
import { loadProfile } from '../hooks/useProfile'

interface Props {
  onDone: () => void
}

export function IntroScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in')
  const name = loadProfile().name

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100)
    const t2 = setTimeout(() => setPhase('out'), 2600)
    const t3 = setTimeout(() => onDone(), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const visible = phase !== 'in'

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#07050e',
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% 50%, rgba(120,60,255,0.35) 0%, transparent 65%),
          radial-gradient(ellipse 80% 60% at 20% 80%, rgba(80,30,200,0.20) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(150,80,255,0.15) 0%, transparent 50%)
        `,
        transition: 'opacity 0.6s cubic-bezier(.4,0,.2,1)',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Ambient glow circle behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          background: 'radial-gradient(circle, rgba(139,124,248,0.25) 0%, transparent 70%)',
          transition: 'opacity 0.8s ease',
          opacity: visible ? 1 : 0,
          animation: visible ? 'glowPulse 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Logo icon */}
      <div
        style={{
          transition: 'all 0.75s cubic-bezier(.34,1.56,.64,1)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(24px)',
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-7"
          style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(139,124,248,0.45) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(167,139,250,0.40)',
            boxShadow: '0 0 60px rgba(139,124,248,0.45), 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(200,185,255,0.95)" strokeWidth={2.1} className="w-11 h-11">
            <path d="M3 11l7-7 4 4 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 11v10H3V11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Greeting */}
      <div
        style={{
          transition: 'all 0.6s cubic-bezier(.4,0,.2,1) 0.3s',
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          opacity: visible ? 1 : 0,
          textAlign: 'center',
        }}
      >
        <div
          className="text-[13px] font-semibold mb-1.5 tracking-wide"
          style={{ color: 'rgba(167,139,250,0.80)' }}
        >
          Добро пожаловать
        </div>
        <div
          className="text-4xl font-black tracking-tight"
          style={{ color: '#f0eeff' }}
        >
          Привет, {name}!
        </div>
        <div
          className="text-[11px] mt-3 tracking-[0.25em] uppercase font-semibold"
          style={{ color: 'rgba(240,238,255,0.35)' }}
        >
          Гастропаб Чехов · Ярославль
        </div>
      </div>

      {/* Bottom pulse dots */}
      <div
        className="absolute bottom-16 flex gap-2"
        style={{ transition: 'opacity 0.5s ease 0.55s', opacity: visible ? 1 : 0 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--accent)',
              animation: 'pulseDot 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
