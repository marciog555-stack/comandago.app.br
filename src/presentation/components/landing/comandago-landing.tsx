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
 * só, opacity+translate (nunca width/height/parallax). Deliberadamente SEM
 * scroll-scrub/parallax contínuo no hero: fica pesado, atrapalha leitura e
 * é o primeiro item na lista de antipadrões de movimento em web.
 */
export function ComandaGoLanding() {
  useLenis()
  const heroRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const prefereReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (!prefereReduzido && heroRef.current) {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-hero-kicker]', { opacity: 0, y: 14, duration: 0.4 })
          .from('[data-hero-title]', { opacity: 0, y: 22, duration: 0.55 }, '-=0.25')
          .from('[data-hero-sub]', { opacity: 0, y: 16, duration: 0.45 }, '-=0.3')
          .from('[data-hero-cta]', { opacity: 0, y: 12, duration: 0.4 }, '-=0.25')
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

      <section ref={heroRef} className="relative overflow-hidden bg-[#1A1310] text-[#FBF4E8]">
        <HeroGrafico />
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <p data-hero-kicker className="text-sm font-medium uppercase tracking-[0.2em] text-[#E2572B]">
            Pra restaurantes de Anápolis-GO
          </p>
          <h1
            data-hero-title
            className="display-title mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-6xl sm:leading-[1.05]"
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
 * Fundo do hero: tratamento gráfico (não foto/vídeo — sem asset real
 * disponível ainda) inspirado no motivo de "comanda"/ticket do nome da
 * marca. Estático de propósito (sem gradiente pulsando/blob animado —
 * antipadrão: come bateria à toa) — o movimento da seção inteira já está
 * concentrado na entrada do texto por cima.
 */
function HeroGrafico() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-[60%] opacity-40 sm:opacity-60"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMaxYMid slice"
    >
      <defs>
        <linearGradient id="brasa" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2572B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1A1310" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="180" y="60" width="340" height="680" rx="18" fill="url(#brasa)" transform="rotate(8 350 400)" />
      <rect
        x="60"
        y="140"
        width="340"
        height="680"
        rx="18"
        fill="none"
        stroke="#FBF4E8"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        transform="rotate(-6 230 480)"
      />
      {Array.from({ length: 7 }).map((_, i) => (
        <line
          key={i}
          x1="100"
          y1={220 + i * 60}
          x2="360"
          y2={220 + i * 60}
          stroke="#FBF4E8"
          strokeOpacity="0.1"
          strokeWidth="1.5"
          transform="rotate(-6 230 480)"
        />
      ))}
    </svg>
  )
}
