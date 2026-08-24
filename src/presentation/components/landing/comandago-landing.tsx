import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useLenis } from '#/presentation/hooks/use-lenis'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Landing de vendas da própria plataforma (não confundir com o cardápio de
 * uma loja) — mostrada em hostContext.modo === 'landing'. Paleta e
 * tipografia próprias da marca ComandaGO (Fraunces + Manrope, já carregadas
 * globalmente em styles.css), deliberadamente distintas do tema por-loja.
 *
 * Movimento: ousadia concentrada na entrada do hero (sequência única,
 * ~600ms) — o resto da página só tem revelações curtas de scroll, uma vez
 * só, opacity+translate (nunca width/height/parallax). O hero em si tem um
 * scroll-scrub controlado (ver `heroTrackRef`/`HeroComandaAnimada` abaixo):
 * a diferença pro antipadrão de parallax genérico é que aqui a cena inteira
 * é vetor que a gente controla, o scrub fica só no hero (não a página
 * toda) e cada quadro nasce diretamente da fração de scroll via
 * `ScrollTrigger({ scrub: true })` — sem seek de `<video>`, sem jank.
 */
export function ComandaGoLanding() {
  useLenis()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroTrackRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const prefereReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const ctx = gsap.context(() => {
      if (!prefereReduzido && heroRef.current) {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-hero-kicker]', { opacity: 0, y: 14, duration: 0.4 })
          .from('[data-hero-title]', { opacity: 0, y: 22, duration: 0.55 }, '-=0.25')
          .from('[data-hero-sub]', { opacity: 0, y: 16, duration: 0.45 }, '-=0.3')
          .from('[data-hero-cta]', { opacity: 0, y: 12, duration: 0.4 }, '-=0.25')
      }

      if (!prefereReduzido && isDesktop && heroTrackRef.current) {
        const track = heroTrackRef.current

        gsap.set('[data-print]', { strokeDasharray: 1, strokeDashoffset: 1 })
        gsap.set('[data-comanda]', { opacity: 0, y: 40 })
        gsap.set('[data-icone]', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' })
        // Conector: fade em vez de "desenhar" o traço — o dasharray dele é
        // um padrão pontilhado que se repete (não um traço único), então o
        // truque de esconder via strokeDashoffset (que funciona nas linhas
        // [data-print], onde dasharray = comprimento total) só desloca qual
        // pedaço fica pontilhado, não some com a linha.
        gsap.set('[data-conector]', { opacity: 0 })
        gsap.set('[data-selo]', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' })

        gsap
          .timeline({ scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.4 } })
          .to('[data-comanda]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
          .to('[data-print]', { strokeDashoffset: 0, stagger: 0.15, duration: 0.6, ease: 'none' }, '-=0.2')
          .to('[data-icone]', { opacity: 1, scale: 1, stagger: 0.2, duration: 0.5, ease: 'back.out(1.6)' }, '-=0.3')
          .to('[data-conector]', { opacity: 1, duration: 0.4, ease: 'power1.out' })
          .to('[data-selo]', { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, '-=0.2')
      }

      if (!prefereReduzido) {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 16,
            duration: 0.4,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-reveal-item]').forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 16,
            duration: 0.35,
            delay: Math.min(i, 8) * 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
          })
        })
      }

      if (!prefereReduzido && ctaRef.current) {
        const cta = ctaRef.current
        const xTo = gsap.quickTo(cta, 'x', { duration: 0.3, ease: 'power3' })
        const yTo = gsap.quickTo(cta, 'y', { duration: 0.3, ease: 'power3' })

        function handleMove(evento: MouseEvent) {
          const rect = cta.getBoundingClientRect()
          xTo((evento.clientX - rect.left - rect.width / 2) * 0.25)
          yTo((evento.clientY - rect.top - rect.height / 2) * 0.25)
        }
        function handleLeave() {
          xTo(0)
          yTo(0)
        }
        cta.addEventListener('mousemove', handleMove)
        cta.addEventListener('mouseleave', handleLeave)
        return () => {
          cta.removeEventListener('mousemove', handleMove)
          cta.removeEventListener('mouseleave', handleLeave)
        }
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="bg-[#FBF4E8] text-[#1A1310]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="display-title text-xl font-semibold tracking-tight">
          Comanda<span className="text-[#E2572B]">GO</span>
        </p>
        <a
          href="#precos"
          className="rounded-full border border-[#1A1310]/15 px-4 py-1.5 text-sm font-medium text-[#1A1310] no-underline transition hover:border-[#1A1310]/30 active:scale-95"
        >
          Quero minha loja
        </a>
      </header>

      {/* Sem overflow-hidden aqui: quebraria o `position: sticky` do scroll-scrub
          abaixo (ancestral com overflow não-visible vira o container de
          referência da stickiness). Cada SVG já se clipa sozinho por padrão. */}
      <section ref={heroRef} className="relative bg-[#1A1310] text-[#FBF4E8]">
        <div ref={heroTrackRef} className="relative md:h-[190vh]">
          <div className="sticky top-0 flex min-h-screen flex-col justify-center">
            <HeroComandaAnimada />
            <div className="relative mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
              <p data-hero-kicker className="text-sm font-medium uppercase tracking-[0.2em] text-[#E2572B]">
                Pra restaurantes de Anápolis-GO
              </p>
              <h1
                data-hero-title
                className="display-title mt-4 max-w-xl text-4xl leading-tight font-semibold sm:text-6xl sm:leading-[1.05]"
              >
                Seu cardápio, seu WhatsApp, sem comissão por pedido.
              </h1>
              <p data-hero-sub className="mt-6 max-w-xl text-lg text-[#FBF4E8]/80">
                Um site de pedidos com a cara do seu restaurante. O cliente monta o pedido, você recebe pronto no
                WhatsApp da loja — sem taxa por venda, sem letra miúda.
              </p>
              <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  ref={ctaRef}
                  href="#precos"
                  className="inline-block rounded-full bg-[#E2572B] px-7 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#c94a22] active:scale-95"
                >
                  Quero minha loja
                </a>
                <span className="text-sm text-[#FBF4E8]/60">R$ 100 de implantação + R$ 50/mês</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="border-y border-[#1A1310]/10 bg-[#F2E7D4]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="display-title text-2xl leading-snug font-medium italic sm:text-3xl">
            "O iFood traz cliente novo. O ComandaGO atende quem já é seu — e quem voltou não precisa custar 25%."
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 data-reveal className="display-title text-3xl font-semibold">
          O que vem junto
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <Recurso
            titulo="Site que é seu"
            descricao="Subdomínio próprio, cores e logo da sua marca — não é um perfil dentro de um app de terceiro."
          />
          <Recurso
            titulo="Pedido direto no WhatsApp"
            descricao="O cliente monta o carrinho no site, a mensagem já sai formatada pro WhatsApp da loja. Sem comissão."
          />
          <Recurso
            titulo="Fidelidade automática"
            descricao="Cada pedido soma ponto pro cliente, sem cadastro nem senha — só o telefone que ele já usa."
          />
          <Recurso
            titulo="Painel simples"
            descricao="Cardápio, fotos, horário e cores você mesmo atualiza, do celular, sem precisar chamar ninguém."
          />
        </div>
      </section>

      <section id="precos" className="bg-[#1A1310] text-[#FBF4E8]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 data-reveal className="display-title text-3xl font-semibold">
            Preço direto
          </h2>
          <div
            data-reveal
            className="mt-8 flex max-w-md flex-col gap-1 rounded-2xl border border-[#FBF4E8]/15 bg-[#FBF4E8]/5 p-8"
          >
            <p className="text-sm text-[#FBF4E8]/60">Implantação (uma vez)</p>
            <p className="display-title text-4xl font-semibold">R$ 100</p>
            <div className="my-4 h-px bg-[#FBF4E8]/15" />
            <p className="text-sm text-[#FBF4E8]/60">Mensalidade</p>
            <p className="display-title text-4xl font-semibold">
              R$ 50<span className="text-lg font-normal text-[#FBF4E8]/60">/mês</span>
            </p>
            <p className="mt-4 text-sm text-[#FBF4E8]/70">Sem multa de cancelamento. Sem taxa por pedido.</p>
          </div>
          <p data-reveal className="mt-8 text-sm text-[#FBF4E8]/60">
            Atendimento presencial em Anápolis-GO — a implantação é feita junto com você, do cadastro do cardápio às
            fotos.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-[#1A1310]/50">
        ComandaGO — Anápolis, GO.
      </footer>
    </div>
  )
}

function Recurso({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div data-reveal-item className="rounded-xl border border-[#1A1310]/10 bg-white/60 p-6">
      <p className="font-semibold text-[#1A1310]">{titulo}</p>
      <p className="mt-2 text-sm text-[#1A1310]/70">{descricao}</p>
    </div>
  )
}

/**
 * Cena do hero: a comanda "se preenche" (linhas de pedido desenhando via
 * stroke-dashoffset, ícones de comida entrando, um conector pontilhado até
 * o selo de "pedido enviado") conforme a fração de scroll do hero — dirigido
 * pelo `ScrollTrigger({ scrub })` no componente pai, não por CSS/self-timer.
 * No estado de repouso (SSR, JS desligado, `prefers-reduced-motion`, mobile)
 * todo mundo já nasce no estado final (opacity 1, traço completo): só o
 * efeito `useEffect` some com esse estado no início e o scrub devolve aos
 * poucos — igual ao padrão já usado na entrada do texto do hero.
 *
 * O selo não reproduz o logo do WhatsApp (risco de marca) — é um ícone de
 * balão de conversa + check genérico, só a cor de marca remete ao produto.
 */
function HeroComandaAnimada() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[56%] md:block"
      viewBox="0 0 640 800"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="brasa" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2572B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1A1310" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="190" y="80" width="340" height="680" rx="18" fill="url(#brasa)" transform="rotate(6 360 420)" />

      <g data-comanda transform="rotate(-4 340 420)">
        <rect x="180" y="120" width="300" height="600" rx="14" fill="#FBF4E8" />
        <line
          data-print
          x1="220"
          y1="180"
          x2="360"
          y2="180"
          stroke="#1A1310"
          strokeOpacity="0.5"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
        />
        <line
          data-print
          x1="220"
          y1="210"
          x2="300"
          y2="210"
          stroke="#1A1310"
          strokeOpacity="0.3"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            data-print
            x1="220"
            y1={270 + i * 40}
            x2={i % 2 === 0 ? 440 : 380}
            y2={270 + i * 40}
            stroke="#1A1310"
            strokeOpacity="0.18"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={1}
          />
        ))}

        <g data-icone transform="translate(220 500)">
          <rect x="2" y="16" width="42" height="26" rx="5" fill="none" stroke="#E2572B" strokeWidth="3" />
          <line x1="2" y1="22" x2="44" y2="22" stroke="#E2572B" strokeWidth="3" />
          <path d="M15 16 q4 -10 8 0" fill="none" stroke="#E2572B" strokeWidth="2" strokeLinecap="round" />
          <path d="M27 16 q4 -10 8 0" fill="none" stroke="#E2572B" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g data-icone transform="translate(290 500)">
          <path d="M0 20 a23 14 0 0 1 46 0 z" fill="none" stroke="#E2572B" strokeWidth="3" />
          <line x1="2" y1="26" x2="44" y2="26" stroke="#E2572B" strokeWidth="3" />
          <path d="M0 34 a23 10 0 0 0 46 0" fill="none" stroke="#E2572B" strokeWidth="3" />
        </g>
        <g data-icone transform="translate(360 500)">
          <path d="M4 6 h30 l-4 40 h-22 z" fill="none" stroke="#E2572B" strokeWidth="3" />
          <line x1="19" y1="0" x2="19" y2="6" stroke="#E2572B" strokeWidth="3" />
        </g>
      </g>

      <path
        data-conector
        d="M460 380 C 510 360, 540 320, 560 260"
        fill="none"
        stroke="#FBF4E8"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />

      <g data-selo transform="translate(560 220)">
        <circle r="46" fill="#E2572B" />
        <path
          d="M-16 4 a16 16 0 1 1 8 14 l-10 3 z"
          fill="none"
          stroke="#FBF4E8"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M-16 20 l7 12 16 -20" fill="none" stroke="#FBF4E8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
