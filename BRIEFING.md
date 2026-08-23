# ComandaGO — Briefing do Projeto

> Documento de contexto para desenvolvimento com Claude Code.
> Domínio: `comandago.app.br` · Autor: Márcio (Gomes Tech) · Praça inicial: Anápolis-GO

## 1. O que é

Plataforma multi-tenant (SaaS) que dá a restaurantes pequenos e médios um site de pedidos próprio, com identidade visual da loja, checkout direto no WhatsApp e zero comissão por pedido.

Cada loja recebe um subdomínio: `brasaecia.comandago.app.br`.

Não confundir com o MeuCardápio — projeto anterior, single-tenant, com 3 clientes rodando. O MeuCardápio não será alterado. O ComandaGO é a versão multi-tenant, construída do zero, com aprendizados dele.

### Posicionamento

O público-alvo principal são estabelecimentos de Anápolis que não têm site nenhum hoje. Eles não têm preço de referência nem sistema para migrar — a venda é "você não tem, eu faço".

Discurso de venda correto (importante, não inverter):

> "iFood pra atrair cliente novo. ComandaGO pra atender quem já é seu.
> O cliente que voltou não precisa custar 25%."

Não posicionar como substituto do iFood. O iFood traz demanda; o site converte demanda que já existe. Pedir para o lojista sair do iFood é uma promessa que não se sustenta e derruba a credibilidade da venda.

### Preço

- R$ 100 de setup (uma vez)
- R$ 50/mês — sem contrato, sem fidelidade
- Upgrade futuro: domínio próprio (`brasaecia.com.br`) — R$ 150 setup + R$ 10/mês

## 2. Stack

- React + TypeScript
- TanStack Start (SSR obrigatório — ver seção 5)
- Tailwind v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- pnpm
- Deploy: Vercel
- Arquitetura DDD-lite

## 3. Arquitetura multi-tenant

Um único app resolvendo por hostname. Nunca um deploy por cliente.

```
requisição
  → middleware lê o header Host
  → extrai subdomínio OU casa com custom_domain
  → busca tenant no Supabase
  → renderiza com tema + cardápio daquela loja
```

### Mapa de hosts

| Host | Destino |
|---|---|
| `comandago.app.br` | Landing de vendas |
| `app.comandago.app.br` | Painel do lojista |
| `{slug}.comandago.app.br` | Site público da loja |
| `{custom_domain}` | Site público da loja (upgrade) |

### Reservar slugs

Bloquear na criação: `app`, `www`, `api`, `admin`, `painel`, `mail`, `blog`, `static`, `assets`, `cdn`.

### Vercel

Configurar domínio wildcard `*.comandago.app.br`. SSL é automático. Confirmar que o registro.br permite o wildcard antes de qualquer coisa.

## 4. Schema inicial

**Regra inegociável:** `tenant_id` em toda tabela de dados, e RLS ativo desde a primeira migration.

Um furo de escopo aqui vaza pedido, nome, telefone e endereço de cliente de uma loja para outra. Isso é incidente de LGPD e, numa cidade pequena, mata a reputação do negócio.

### Tabelas

**tenants**
`id`, `slug` (único), `custom_domain` (nullable, único), `nome`, `logo_url`, `cor_primaria`, `cor_fundo`, `whatsapp`, `endereco`, `horarios` (jsonb), `taxa_entrega`, `pedido_minimo`, `ativo`, `plano`, `criado_em`

> `custom_domain` entra agora, mesmo sem uso. Adicionar campo depois é trivial; refatorar roteamento com 40 clientes no ar, não.

**tenant_usuarios**
`tenant_id`, `user_id` (auth.users), `role` (`owner` | `staff`)

**categorias**
`id`, `tenant_id`, `nome`, `ordem`, `ativo`

**produtos**
`id`, `tenant_id`, `categoria_id`, `nome`, `descricao`, `preco`, `imagem_url`, `ativo`, `ordem`

**pedidos**
`id`, `tenant_id`, `numero`, `cliente_nome`, `cliente_telefone`, `itens` (jsonb), `subtotal`, `taxa_entrega`, `total`, `tipo` (`entrega` | `retirada`), `endereco`, `observacao`, `forma_pagamento`, `status`, `criado_em`

**fidelidade_clientes**
`tenant_id`, `telefone`, `nome`, `pontos`, `ultimo_pedido`
→ chave composta (`tenant_id`, `telefone`). Sem senha, sem cadastro — identificação só pelo WhatsApp. Esse é o diferencial competitivo mais forte do produto.

### Políticas RLS

- `categorias` / `produtos`: leitura anônima permitida apenas quando o tenant está ativo (o cardápio é público). Escrita só para membros do tenant.
- `pedidos`: insert anônimo permitido (cliente final não tem login). Select/update apenas para membros do tenant. Cliente anônimo nunca lê pedido de ninguém.
- `tenants`: leitura pública dos campos de vitrine; escrita só pelo owner.
- Todo o resto: negado por padrão.

Escrever teste que tenta ler dado de outro `tenant_id` e falha. Isso não é opcional.

## 5. SSR e SEO — prioridade nº 1

O MeuCardápio renderiza tudo no client: um fetch da página traz só meta tags, sem conteúdo. Isso significa que os sites dos clientes não indexam no Google.

"hamburgueria delivery Anápolis" é demanda gratuita, todo dia, e hoje vai inteira pro iFood.

Consertar isso muda três coisas:

1. O produto passa a gerar pedido, não só organizar
2. Justifica cobrar mais
3. Lojista que recebe pedido do Google não cancela assinatura

Requisitos:

- Cardápio público renderizado no servidor (TanStack Start já faz)
- Meta tags e Open Graph por loja
- JSON-LD `Restaurant` + `Menu` (schema.org)
- `sitemap.xml` e `robots.txt` por subdomínio
- H1 com nome da loja + cidade
- Imagens otimizadas com `alt` descritivo

**Atenção:** subdomínio não herda autoridade de SEO do domínio principal. O Google trata cada loja como site independente. Para busca local de baixa concorrência isso não é impeditivo — mas exige que cada site seja bem feito e esteja ligado ao Google Meu Negócio da loja.

## 6. Escopo do v1

### Entra

1. **Cardápio público** (SSR) — categorias, produtos, fotos, horário, status aberto/fechado
2. **Carrinho + checkout** — monta o pedido e abre o WhatsApp da loja com mensagem formatada
3. **Painel do lojista** — CRUD de categorias e produtos, upload de foto, horários, cores/logo
4. **Fidelidade automática** — pontos por telefone, consulta sem senha
5. **Provisionamento** — tela admin (só Márcio) que cria a loja e o subdomínio
6. **Tema por loja** — cores e logo vindos do banco, aplicados via CSS variables

### Fica de fora (v2+)

- Pagamento online / split
- Integração com Zumm ou Juma (o lojista chama o motoboy como já faz hoje)
- App nativo
- Multi-unidade
- Impressora térmica
- Domínio próprio (o campo existe, a feature não)

### Sobre integração de entrega

Márcio não vai ganhar dinheiro com a entrega. Isso elimina a necessidade de contrato B2B, faturamento de corrida e risco de inadimplência.

Quando entrar (v2), o modelo é: o lojista tem conta própria na Zumm/Juma, e o ComandaGO só dispara a corrida via API com as credenciais dele.

Se for construir, usar padrão adapter — `DeliveryProvider` com `ZummAdapter` e `JumaAdapter` atrás da mesma interface (`criarCorrida`, `consultarStatus`, `cancelar`, `webhook`). Nunca acoplar num fornecedor só.

## 7. Restrições operacionais

- Márcio trabalha sozinho e majoritariamente do celular
- Onboarding é presencial: ele vai na loja, cadastra o cardápio, tira as fotos, treina o dono
- Suporte é ele no WhatsApp
- Teto realista de atendimento individual: 40 a 60 clientes
- Por isso: onboarding tem que ser rápido. Cada hora economizada no cadastro de uma loja é margem direta. Priorizar importação em massa, duplicação de produto e templates de cardápio por tipo de estabelecimento.

## 8. Referências de mercado (Anápolis)

Concorrentes diretos já operando: Anota Aí, Cardápio Web, Goomer, Delivery Direto, InstaDelivery, Accon, Saipos, Jotajá. Todos com preço a partir de ~R$50/mês.

Não dá para ganhar deles em feature nem em preço. A vantagem é: presença física, site sob medida (não template) e resposta em horas.

Entregadores locais: Zumm Delivery (Anápolis, Rio Verde, Itumbiara, Caldas Novas, Goianésia, Uberlândia — cobra por km, sem mensalidade) e Juma Delivery (franquia, atende Anápolis, corrida a partir de ~R$5, assume responsabilidade por extravio). As duas já integram com iFood, Anota Aí, Cardápio Web e Goomer — ou seja, o caminho técnico existe e é conhecido. Nenhuma dará exclusividade.

## 9. Primeiros passos

1. Criar repo e projeto Supabase
2. **Migration inicial: schema + RLS + policies** (antes de qualquer UI)
3. Teste automatizado de isolamento entre tenants
4. Middleware de resolução por hostname
5. Cardápio público com SSR
6. Carrinho e checkout WhatsApp
7. Painel do lojista
8. Fidelidade

Só depois disso, landing de vendas.
