import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

/**
 * Rolagem suave só na landing (não no cardápio/painel — lá o scroll padrão
 * do navegador já é o esperado). Sincroniza com o ticker do GSAP pra
 * ScrollTrigger acompanhar certo — inclusive os scrubs (`scrub: true`) do
 * hero, que dependem de saber a posição de scroll a cada frame, não só nas
 * revelações de uma vez. Desliga sozinho se o usuário pedir menos
 * movimento no sistema (prefers-reduced-motion) — nesse caso a rolagem
 * nativa já é suave o bastante, Lenis só adicionaria sensação de inércia
 * que quem pediu "reduzir movimento" não quer.
 */
export function useLenis() {
  useEffect(() => {
    const prefereReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefereReduzido) return

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)

    function onTick(time: number) {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [])
}
