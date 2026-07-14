'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_LOCALE, UI_STRINGS, type Locale } from '@/lib/i18n'
import type { ContentMap } from '@/lib/content-defaults'

export type PhotoView = {
  id: string
  title: string
  alt: string
  technique: string | null
  year: number | null
  url: string
}

type Props = {
  content: Record<Locale, ContentMap>
  photos: { work: PhotoView[]; art: PhotoView[] }
}

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 11L11 3M11 3H4.5M11 3V9.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function SiteRoot({ content, photos }: Props) {
  const [lang, setLang] = useState<Locale>(DEFAULT_LOCALE)
  const rootRef = useRef<HTMLDivElement>(null)
  const t = content[lang]
  const ui = (key: string) => UI_STRINGS[lang][key] ?? key

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Scroll reveal + word masks (re-runs so new nodes are observed).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll('.reveal, .word-mask')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const services = [
    { n: '01', title: t['work.svc1_title'], desc: t['work.svc1_desc'], price: t['work.svc1_price'] },
    { n: '02', title: t['work.svc2_title'], desc: t['work.svc2_desc'], price: t['work.svc2_price'] },
    { n: '03', title: t['work.svc3_title'], desc: t['work.svc3_desc'], price: t['work.svc3_price'] },
    { n: '04', title: t['work.svc4_title'], desc: t['work.svc4_desc'], price: t['work.svc4_price'] },
  ]

  const marqueeItems = (t['marquee.items'] || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)

  const workFeatured = photos.work.slice(0, 2)
  const artGallery = photos.art.slice(0, 5)

  return (
    <div ref={rootRef} className="grain">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-border">
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="dot" />
            <span className="text-[15px] font-medium tracking-tight">{t['site.name']}</span>
          </a>
          <div className="hidden md:flex items-center gap-9 text-[13px]">
            <a href="#work" className="link-underline">{ui('nav.work')}</a>
            <a href="#art" className="link-underline">{ui('nav.art')}</a>
            <a href="#about" className="link-underline">{ui('nav.about')}</a>
            <a href="#contact" className="link-underline">{ui('nav.contact')}</a>
          </div>
          <div className="flex items-center gap-3 text-[13px] mono">
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
              aria-pressed={lang === 'ru'}
            >
              RU
            </button>
            <span style={{ color: 'color-mix(in oklch, var(--foreground) 30%, transparent)' }}>/</span>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="top"
        className="relative min-h-[100svh] flex flex-col justify-end px-6 md:px-10 pb-16 pt-32 overflow-hidden"
      >
        <div className="hero-glow" style={{ top: '8%', left: '-10%' }} />
        <div
          className="hero-glow"
          style={{ bottom: '-20%', right: '-15%', background: 'radial-gradient(circle, oklch(0.94 0 0), transparent 70%)' }}
        />
        <div className="max-w-[1400px] mx-auto w-full relative z-10">
          <div className="flex items-center gap-3 mb-10 reveal">
            <span className="dot" style={{ background: '#10b981' }} />
            <span className="section-label">{t['hero.badge']}</span>
          </div>

          <h1 className="display tracking-tight">
            <span className="word-mask"><span className="word-inner">{t['hero.title_1']}</span></span>{' '}
            <br />
            <span className="serif italic" style={{ fontSize: 'clamp(3.2rem,11vw,11rem)', letterSpacing: '-0.02em' }}>
              <span className="word-mask"><span className="word-inner" style={{ transitionDelay: '0.16s' }}>{t['hero.title_accent']}</span></span>
            </span>{' '}
            <span className="word-mask"><span className="word-inner" style={{ transitionDelay: '0.24s' }}>{t['hero.title_2']}</span></span>
          </h1>

          <div className="mt-14 grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-5 reveal" style={{ transitionDelay: '0.3s' }}>
              <p
                className="text-[17px] leading-relaxed max-w-md"
                style={{ color: 'color-mix(in oklch, var(--foreground) 70%, transparent)' }}
              >
                {t['hero.subtitle']}
              </p>
            </div>
            <div className="md:col-span-4 md:col-start-9 reveal" style={{ transitionDelay: '0.4s' }}>
              <div
                className="flex flex-col gap-3 text-[13px] mono uppercase tracking-wider"
                style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}
              >
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span>{t['hero.stat_since_label']}</span>
                  <span className="num-badge">{t['hero.stat_since_value']}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span>{t['hero.stat_projects_label']}</span>
                  <span className="num-badge">{t['hero.stat_projects_value']}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t['hero.stat_clients_label']}</span>
                  <span className="num-badge">{t['hero.stat_clients_value']}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-4 reveal" style={{ transitionDelay: '0.5s' }}>
            <a href="#work" className="btn-primary inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-[14px] font-medium">
              <span>{ui('hero.explore')}</span>
              <ArrowIcon />
            </a>
            <a href="#art" className="text-[14px] link-underline">{ui('hero.seeArt')}</a>
          </div>
        </div>

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[11px] mono uppercase tracking-[0.2em]"
          style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}
        >
          <span>{ui('hero.scroll')}</span>
          <div className="w-px h-8 bg-gradient-to-b from-current to-transparent" />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="py-6 border-y border-border overflow-hidden">
        <div
          className="marquee-track text-[clamp(1.2rem,2.4vw,2rem)] serif italic"
          style={{ color: 'color-mix(in oklch, var(--foreground) 75%, transparent)' }}
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="px-8">{item}</span>
              <span className="px-8">—</span>
            </span>
          ))}
        </div>
      </div>

      {/* WORK */}
      <section id="work" className="px-6 md:px-10 py-28 md:py-40">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-12 gap-8 mb-20">
            <div className="md:col-span-3 reveal">
              <div className="flex items-center gap-2.5">
                <span className="num-badge text-[13px] mono" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>01 / 02</span>
                <span className="dot" style={{ background: 'color-mix(in oklch, var(--foreground) 40%, transparent)' }} />
              </div>
              <h2 className="section-label mt-5">{t['work.label']}</h2>
            </div>
            <div className="md:col-span-9 reveal" style={{ transitionDelay: '0.1s' }}>
              <h3 className="text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.02] tracking-tight font-medium">
                <span>{t['work.title_1']}</span>
                <span className="serif italic" style={{ color: 'color-mix(in oklch, var(--foreground) 60%, transparent)' }}>{t['work.title_2']}</span>
              </h3>
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            {services.map((s) => (
              <div key={s.n} className="service-row flex items-center justify-between py-7 cursor-pointer">
                <div className="flex items-center gap-6 md:gap-10">
                  <span className="num-badge text-[13px] mono" style={{ color: 'color-mix(in oklch, var(--foreground) 40%, transparent)' }}>{s.n}</span>
                  <div>
                    <h4 className="text-[22px] md:text-[28px] font-medium tracking-tight">{s.title}</h4>
                    <p className="text-[14px] mt-1.5 max-w-md" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>{s.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="hidden md:block text-[13px] mono uppercase tracking-wider" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>{s.price}</span>
                  <div className="arrow-circle w-11 h-11 rounded-full border border-border flex items-center justify-center">
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {workFeatured.length > 0 && (
            <div className="grid md:grid-cols-2 gap-5 mt-24">
              {workFeatured.map((p, i) => (
                <a key={p.id} href="#" className="card-hover group block rounded-2xl overflow-hidden reveal border border-border" style={{ background: 'var(--muted)', transitionDelay: `${i * 0.1}s` }}>
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <Image src={p.url} alt={p.alt || p.title} fill sizes="(max-width: 768px) 100vw, 700px" className="img-zoom object-cover" />
                  </div>
                  <div className="p-6 md:p-7 flex items-start justify-between">
                    <div>
                      <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>{[p.technique, p.year].filter(Boolean).join(' · ')}</p>
                      <h4 className="text-[24px] font-medium tracking-tight mt-2">{p.title}</h4>
                    </div>
                    <span className="text-[13px] mono" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ART */}
      <section id="art" className="px-6 md:px-10 py-28 md:py-40 border-t border-border" style={{ background: 'var(--muted)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-12 gap-8 mb-20">
            <div className="md:col-span-3 reveal">
              <div className="flex items-center gap-2.5">
                <span className="num-badge text-[13px] mono" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>02 / 02</span>
                <span className="dot" />
              </div>
              <h2 className="section-label mt-5">{t['art.label']}</h2>
            </div>
            <div className="md:col-span-9 reveal" style={{ transitionDelay: '0.1s' }}>
              <h3 className="text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.02] tracking-tight font-medium">
                <span>{t['art.title_1']}</span>
                <span className="serif italic" style={{ color: 'color-mix(in oklch, var(--foreground) 60%, transparent)' }}>{t['art.title_2']}</span>
              </h3>
            </div>
          </div>

          {artGallery.length > 0 && (
            <div className="grid md:grid-cols-12 gap-5">
              {artGallery.map((p, i) => {
                const spans = ['md:col-span-7', 'md:col-span-5', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4']
                const aspects = ['aspect-[16/10]', 'aspect-[4/5]', 'aspect-square', 'aspect-square', 'aspect-square']
                return (
                  <a key={p.id} href="#" className={`card-hover ${spans[i]} block rounded-2xl overflow-hidden reveal border border-border`} style={{ transitionDelay: `${(i % 3) * 0.1}s` }}>
                    <div className={`${aspects[i]} overflow-hidden relative`}>
                      <Image src={p.url} alt={p.alt || p.title} fill sizes="(max-width: 768px) 100vw, 600px" className="img-zoom object-cover" />
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <p className="text-[15px] font-medium">{p.title}</p>
                      <p className="text-[12px] mono uppercase tracking-wider" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>{[p.technique, p.year].filter(Boolean).join(' · ')}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          <div className="mt-12 flex justify-center reveal">
            <a href="#" className="text-[14px] link-underline inline-flex items-center gap-2">
              <span>{ui('work.viewGallery')}</span>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 md:px-10 py-28 md:py-40">
        <div className="max-w-[1100px] mx-auto">
          <div className="reveal"><span className="section-label">{t['about.label']}</span></div>
          <blockquote className="mt-10 reveal" style={{ transitionDelay: '0.1s' }}>
            <p className="text-[clamp(1.6rem,3.6vw,3rem)] leading-[1.15] tracking-tight font-light">
              <span className="serif italic">{t['about.quote_1']}</span>
              <span>{t['about.quote_2']}</span>
            </p>
          </blockquote>
          <div className="mt-12 grid md:grid-cols-3 gap-10 reveal" style={{ transitionDelay: '0.2s' }}>
            <div>
              <p className="section-label mb-3" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>{t['about.based_label']}</p>
              <p className="text-[15px]">{t['about.based_value']}</p>
            </div>
            <div>
              <p className="section-label mb-3" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>{t['about.training_label']}</p>
              <p className="text-[15px]">{t['about.training_value']}</p>
            </div>
            <div>
              <p className="section-label mb-3" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>{t['about.recognition_label']}</p>
              <p className="text-[15px]">{t['about.recognition_value']}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 md:px-10 py-28 md:py-40 border-t border-border" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8 reveal">
              <span className="section-label" style={{ color: 'color-mix(in oklch, var(--background) 60%, transparent)' }}>{t['contact.label']}</span>
              <h3 className="mt-6 text-[clamp(2.4rem,6.5vw,5.5rem)] leading-[0.98] tracking-tight font-medium">
                <span>{t['contact.title_1']}</span>
                <br />
                <span className="serif italic" style={{ color: 'color-mix(in oklch, var(--background) 70%, transparent)' }}>{t['contact.title_2']}</span>
              </h3>
            </div>
            <div className="md:col-span-4 reveal" style={{ transitionDelay: '0.15s' }}>
              <a href={`mailto:${t['contact.email']}`} className="inline-flex items-center gap-3 text-[16px] group">
                <span className="link-underline">{t['contact.email']}</span>
                <span className="arrow-circle w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: 'color-mix(in oklch, var(--background) 30%, transparent)' }}>
                  <ArrowIcon />
                </span>
              </a>
              <p className="mt-6 text-[14px]" style={{ color: 'color-mix(in oklch, var(--background) 65%, transparent)' }}>{t['contact.note']}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-10 border-t border-border">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[13px]">
          <div className="flex items-center gap-2.5">
            <span className="dot" />
            <span className="font-medium tracking-tight">{t['footer.brand']}</span>
            <span style={{ color: 'color-mix(in oklch, var(--foreground) 40%, transparent)' }}>— {t['footer.copyright']}</span>
          </div>
          <div className="flex items-center gap-7" style={{ color: 'color-mix(in oklch, var(--foreground) 60%, transparent)' }}>
            <a href="#" className="link-underline">{t['footer.social_1']}</a>
            <a href="#" className="link-underline">{t['footer.social_2']}</a>
            <a href="#" className="link-underline">{t['footer.social_3']}</a>
          </div>
          <div className="mono uppercase tracking-wider" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>
            <span>{t['footer.built']}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
