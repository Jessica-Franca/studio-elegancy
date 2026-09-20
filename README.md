# Studio Elegancy — protótipo web

Protótipo front-end de gestão de estúdio de beleza (HTML, CSS, JavaScript e `localStorage`).

Não há backend, API, banco de dados nem autenticação real. Os dados ficam no navegador de cada pessoa que testa.

Slogan: **Beleza que te representa.**

## URL pública

https://jessica-franca.github.io/studio-elegancy/

## Como testar

Abra a URL acima no navegador. Na primeira visita o protótipo carrega uma massa **fictícia** de clientes, serviços, agendamentos e retornos.

Os dados são locais: cada dispositivo/navegador tem a própria cópia. Limpar o armazenamento do site volta ao seed inicial.

Não use dados reais de clientes neste ambiente.

## Telas

- `index.html` — Início / Dashboard
- `agenda.html` — Dia, Semana, Mês e período
- `clientes.html` — Lista e perfil
- `retornos.html` — Ciclos de manutenção e acompanhamento
- `servicos.html` — Catálogo Unhas / Cílios / Sobrancelhas
- `relatorios.html` — Estrutura de relatórios
- `configuracoes.html` — Ajustes
- `login.html` — Tela de demonstração (os dois botões abrem o mesmo protótipo)

## Persistência

- `studioElegancy_clientes`
- `studioElegancy_agendamentos`
- `studioElegancy_anamneses`
- `studioElegancy_servicos`
- `studioElegancy_manutencoes`

## Abrir no computador

Sirva a pasta do repositório (não abra o arquivo como `file://` se o navegador bloquear módulos ou caminhos).

```bash
npx --yes serve .
```

## Design

`css/tokens.css` concentra paleta e fontes (Playfair Display, Inter, Great Vibes no slogan).
