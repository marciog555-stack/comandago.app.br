/**
 * Landing de vendas da própria plataforma (não confundir com o cardápio de
 * uma loja) — mostrada em hostContext.modo === 'landing'. Paleta e
 * tipografia próprias da marca ComandaGO (Fraunces + Manrope, já
 * carregadas globalmente em styles.css), deliberadamente distintas do tema
 * por-loja (cor_primaria/cor_fundo, aplicado só no cardápio público).
 */
export function ComandaGoLanding() {
  return (
    <div className="bg-[#FBF4E8] text-[#1A1310]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="display-title text-xl font-semibold tracking-tight">
          Comanda<span className="text-[#E2572B]">GO</span>
        </p>
        <a
          href="#precos"
          className="rounded-full border border-[#1A1310]/15 px-4 py-1.5 text-sm font-medium text-[#1A1310] no-underline hover:border-[#1A1310]/30"
        >
          Quero minha loja
        </a>
      </header>

      <section className="bg-[#1A1310] text-[#FBF4E8]">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#E2572B]">
            Pra restaurantes de Anápolis-GO
          </p>
          <h1 className="display-title mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-6xl sm:leading-[1.05]">
            Seu cardápio, seu WhatsApp, sem comissão por pedido.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#FBF4E8]/80">
            Um site de pedidos com a cara do seu restaurante. O cliente monta o pedido, você recebe pronto no
            WhatsApp da loja — sem taxa por venda, sem letra miúda.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#precos"
              className="rounded-full bg-[#E2572B] px-7 py-3 font-semibold text-white transition hover:bg-[#c94a22]"
            >
              Quero minha loja
            </a>
            <span className="text-sm text-[#FBF4E8]/60">R$ 100 de implantação + R$ 50/mês</span>
          </div>
        </div>
      </section>

      <section className="border-y border-[#1A1310]/10 bg-[#F2E7D4]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="display-title text-2xl leading-snug font-medium italic sm:text-3xl">
            "O iFood traz cliente novo. O ComandaGO atende quem já é seu — e quem voltou não precisa custar 25%."
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="display-title text-3xl font-semibold">O que vem junto</h2>
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
          <h2 className="display-title text-3xl font-semibold">Preço direto</h2>
          <div className="mt-8 flex max-w-md flex-col gap-1 rounded-2xl border border-[#FBF4E8]/15 bg-[#FBF4E8]/5 p-8">
            <p className="text-sm text-[#FBF4E8]/60">Implantação (uma vez)</p>
            <p className="display-title text-4xl font-semibold">R$ 100</p>
            <div className="my-4 h-px bg-[#FBF4E8]/15" />
            <p className="text-sm text-[#FBF4E8]/60">Mensalidade</p>
            <p className="display-title text-4xl font-semibold">
              R$ 50<span className="text-lg font-normal text-[#FBF4E8]/60">/mês</span>
            </p>
            <p className="mt-4 text-sm text-[#FBF4E8]/70">Sem multa de cancelamento. Sem taxa por pedido.</p>
          </div>
          <p className="mt-8 text-sm text-[#FBF4E8]/60">
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
    <div className="rounded-xl border border-[#1A1310]/10 bg-white/60 p-6">
      <p className="font-semibold text-[#1A1310]">{titulo}</p>
      <p className="mt-2 text-sm text-[#1A1310]/70">{descricao}</p>
    </div>
  )
}
