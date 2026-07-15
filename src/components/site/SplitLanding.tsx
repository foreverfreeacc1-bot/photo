'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lang = 'ru' | 'en'

type Panel = {
  href: string
  title: string
  caption: Record<Lang, string>
  desc: Record<Lang, string>
  cta: Record<Lang, string>
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
  const [lang, setLang] = useState<Lang>('ru')

  const panels: Panel[] = [
    {
      href: '/site#work',
      title: 'WORK',
      caption: { ru: 'коммерческие проекты', en: 'commercial projects' },
      desc: {
        ru: 'Брендинг, дизайн интерфейсов, арт-дирекция.',
        en: 'Branding, interface design, art direction.',
      },
      cta: { ru: 'Смотреть услуги', en: 'View work' },
      img: workImg,
    },
    {
      href: '/site#art',
      title: 'ART',
      caption: { ru: 'личное творчество', en: 'personal practice' },
      desc: {
        ru: 'Живопись, графика, эксперименты с формой и материалом.',
        en: 'Painting, graphics, experiments with form and material.',
      },
      cta: { ru: 'Смотреть работы', en: 'View art' },
      img: artImg,
    },
  ]

  return (
    <main className="relative min-h-[100svh] w-full flex flex-col md:flex-row">
      {/* Fixed top bar: brand (left) + language switch (right), no menu */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 py-6 text-white mix-blend-difference">
        <span className="text-[16px] font-medium tracking-tight">{siteName}</span>
        <div className="pointer-events-auto flex items-center gap-2 mono text-[12px]">
          <button
            type="button"
            onClick={() => setLang('ru')}
            className={`transition-opacity ${lang === 'ru' ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
            aria-pressed={lang === 'ru'}
          >
            RU
          </button>
          <span className="opacity-30">/</span>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
        </div>
      </div>

      {panels.map((p) => (
        <Link
          key={p.title}
          href={p.href}
          aria-label={`${p.title} — ${p.caption[lang]}`}
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

          {/* Centered content block */}
          <div className="relative z-10 flex h-full min-h-[50svh] md:min-h-[100svh] flex-col items-center justify-center text-center px-6 text-white">
            <h2
              className="font-medium leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(3.5rem, 12vw, 9rem)' }}
            >
              {p.title}
            </h2>
            <div className="mono text-[11px] uppercase tracking-[0.22em] opacity-75 mt-4">
              {p.caption[lang]}
            </div>
            <p className="max-w-md text-[14px] md:text-[15px] leading-relaxed text-white/85 mt-4 opacity-0 translate-y-3 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              {p.desc[lang]}
            </p>
            <span className="inline-flex items-center gap-2 text-[14px] mt-5 opacity-0 translate-y-3 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:translate-y-0">
              <span className="link-underline">{p.cta[lang]}</span>
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      ))}
    </main>
  )
}
