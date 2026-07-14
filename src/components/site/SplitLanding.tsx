'use client'

import Link from 'next/link'

type Panel = {
  href: string
  index: string
  title: string
  caption: string
  desc: string
  cta: string
  img: string
}

export default function SplitLanding({
  siteName,
  workImg,
  artImg,
}: {
  siteName: string
  workImg: string
  artImg: string
}) {
  const panels: Panel[] = [
    {
      href: '/site#work',
      index: '01',
      title: 'WORK',
      caption: 'коммерческие проекты',
      desc: 'Брендинг, дизайн интерфейсов, арт-дирекция.',
      cta: 'Смотреть услуги',
      img: workImg,
    },
    {
      href: '/site#art',
      index: '02',
      title: 'ART',
      caption: 'личное творчество',
      desc: 'Живопись, графика, эксперименты с формой и материалом.',
      cta: 'Смотреть работы',
      img: artImg,
    },
  ]

  return (
    <main className="relative min-h-[100svh] w-full flex flex-col md:flex-row">
      {/* Minimal brand mark — no navigation menu */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 py-6 text-white mix-blend-difference">
        <span className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-white" />
          {siteName}
        </span>
        <span className="mono text-[11px] uppercase tracking-[0.22em] opacity-80">
          Портфолио
        </span>
      </div>

      {panels.map((p) => (
        <Link
          key={p.title}
          href={p.href}
          aria-label={`${p.title} — ${p.caption}`}
          className="group relative flex-1 min-h-[50svh] md:min-h-[100svh] overflow-hidden md:transition-[flex-grow] md:duration-700 md:ease-[cubic-bezier(0.16,1,0.3,1)] md:hover:flex-[1.35] border-b md:border-b-0 md:border-r border-border last:border-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.35] brightness-[0.8] transition-[transform,filter] duration-[1200ms] ease-out group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, oklch(0 0 0 / 0.25) 0%, oklch(0 0 0 / 0.68) 100%)',
            }}
          />

          <div className="relative z-10 flex h-full min-h-[50svh] md:min-h-[100svh] flex-col justify-between p-6 md:p-10 text-white">
            <div className="flex items-center gap-2 mono text-[11px] tracking-[0.22em]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
              <span>
                {p.index} — {p.title}
              </span>
            </div>

            <div>
              <div className="mono text-[11px] uppercase tracking-[0.22em] opacity-75 mb-3">
                {p.caption}
              </div>
              <h2
                className="font-medium leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(3.5rem, 12vw, 9rem)' }}
              >
                {p.title}
              </h2>
              <p className="max-w-md text-[14px] md:text-[15px] leading-relaxed text-white/85 mt-4 opacity-0 translate-y-3 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                {p.desc}
              </p>
              <span className="inline-flex items-center gap-2 text-[14px] mt-5 opacity-0 translate-y-3 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:translate-y-0">
                <span className="link-underline">{p.cta}</span>
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </main>
  )
}
