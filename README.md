# Studio Elegancy

Este repositório GitHub é a **fonte oficial** do Studio Elegancy.

O produto nesta etapa é um **protótipo web** (HTML, CSS, JavaScript e `localStorage`). Não há backend, API, banco de dados nem autenticação real.

## Onde está o protótipo

```text
prototipo-ui/
```

É a única implementação oficial da interface.

## Como executar

Na pasta `prototipo-ui/`:

```bash
npx --yes serve .
```

Abra o endereço que o comando mostrar (por exemplo `http://localhost:3000`).

## Publicação

O GitHub Pages publica o conteúdo de `prototipo-ui/`:

https://jessica-franca.github.io/studio-elegancy/

## Fluxo de desenvolvimento

1. Verificar o Git root e `git status`.
2. Editar somente neste repositório, em `prototipo-ui/`.
3. Testar no navegador.
4. Revisar `git diff`.
5. Commit e push em `main`.
6. As testers usam a URL pública.

Não desenvolver em uma cópia avulsa do `prototipo-ui` nem sincronizar pastas manualmente.

## O que não entra neste repositório

- dados reais de clientes
- `DocsCliente/` (material local da cliente)
- `studio_elegancy/` (legado Python/PySide6, se existir só na máquina)
- credenciais, `.env`, chaves
