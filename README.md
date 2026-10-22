# Jars Together

Kink Jars e Romantic Jars em um único site estático, pronto para GitHub Pages. O nome sugerido para o repositório é **jars-together**.

## O que está pronto

- Duas áreas: **Kinks** e **Romance**, com os 28 itens originais de cada uma.
- Seis idiomas: **English (US)**, **Português (Brasil)**, **Español**, **Français**, **Deutsch** e **简体中文**. O primeiro acesso usa **EN-US**; depois, a escolha de idioma fica salva.
- Nomes, explicações, controles e imagem exportada traduzidos. O nome Jars Together é mantido como marca.
- Botão `?` em cada item: funciona por clique, toque, foco do teclado e passagem do mouse. `Esc` fecha a explicação.
- Nome opcional, paleta, controles RGB, código hexadecimal, prévia, exportação PNG e recomeçar, preservando os recursos dos originais.
- Respostas independentes para cada área, salvas apenas no navegador. Trocar o idioma não altera as notas.
- Layout adaptável para celular e computador. Sem cadastro, servidor de aplicação, banco de dados, bibliotecas JavaScript ou instalação de dependências.

## Como o 5 funciona

O primeiro clique no **5** deixa o pote cheio, sem transbordamento. Cada clique seguinte avança uma etapa:

1. Gotas escorrendo.
2. Poça sob o pote.
3. Corações, mantendo a poça.
4. Respingos, mantendo os efeitos anteriores.
5. Espuma e tampa deslocada.
6. Jato, com o maior transbordamento.

As etapas acumulam líquido e efeitos para que o pote realmente transborde mais. Ao chegar à última, novos cliques mantêm o máximo. Não há sorteio de estilo. Os detalhes do desenho são estáveis por pote.

Escolher **0–4** reinicia a sequência. Tocar novamente em **1–4** esvazia o pote, como no original. **0** também permite esvaziar explicitamente. A prévia e o PNG usam exatamente o mesmo estado de transbordamento.

## Abrir no computador

Na pasta do projeto, execute:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra http://127.0.0.1:4173/. Se tiver Node.js, `npm start` executa a mesma prévia. Não é necessário `npm install`.

Abra por um servidor HTTP: o duplo clique no `index.html` não permite que o navegador carregue os módulos e traduções corretamente.

## Publicar no GitHub Pages

Conta pessoal: [angusbreno](https://github.com/angusbreno). Repositório de publicação: [angusbreno/jars-together](https://github.com/angusbreno/jars-together). Endereço do site: [Jars Together](https://angusbreno.github.io/jars-together/).

### Opção simples: publicar a branch

1. Crie um repositório chamado `jars-together` ou outro nome escolhido por você.
2. Envie o conteúdo desta pasta para a branch `main`, mantendo `index.html`, `assets/`, `locales/` e `.nojekyll` na raiz.
3. Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, branch **main**, pasta **/(root)**, e salve.
4. O endereço será `https://SEU-USUARIO.github.io/jars-together/` (ou o nome escolhido).

### Opção automatizada: GitHub Actions

O arquivo `.github/workflows/pages.yml` já inclui verificação e publicação dos arquivos estáticos. Se escolher essa opção, em **Settings → Pages → Source** selecione **GitHub Actions**, e envie a branch `main` ou execute **Publish GitHub Pages** manualmente em **Actions**.

Escolha uma das duas opções de publicação. Se usar publicação pela branch, remova ou desative o workflow `pages.yml` para evitar um segundo caminho de deploy.

Todos os caminhos de recursos são relativos. O site funciona em um repositório de projeto, sem configurar domínio, prefixo de URL ou etapa de build. No plano GitHub Free, use um repositório público.

Referências: [criar um GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) e [workflow estático oficial](https://github.com/actions/starter-workflows/blob/main/pages/static.yml).

## Verificar

Com Node.js 20 ou superior:

```sh
npm test
```

Os testes cobrem a sequência e seu limite, reinício por nota menor, isolamento das coleções, restauração de respostas, dados salvos inválidos, seis traduções completas, desenho determinístico e renderização das duas coleções em todos os idiomas. Incluem verificações de CSP, recursos locais, entradas maliciosas e permissões do deploy. O escopo da revisão e seus limites estão em [SECURITY.md](SECURITY.md).

## Organização

- `index.html`: estrutura da interface.
- `assets/app.js`: navegação, explicações, cores, salvamento e exportação.
- `assets/catalog.js`: identificadores estáveis dos 56 itens.
- `assets/state.js`: regras de notas e validação das respostas.
- `assets/jars.js`: desenhos originais adaptados e transbordamento progressivo.
- `assets/poster.js`: miniaturas, quebra de linhas e PNG.
- `assets/styles.css`: aparência e layout responsivo.
- `locales/*.json`: os 48 textos de interface e os 56 pares de nome/explicação de cada idioma. A ordem dos itens corresponde à de `catalog.js`.
- `THIRD_PARTY_NOTICES.md`: procedência e créditos dos originais.

As respostas, o nome, a cor e o idioma ficam na chave `jars-together-v1` do armazenamento local do navegador. A ação Recomeçar limpa somente as respostas da área selecionada. Não lê os dados salvos nos domínios dos sites originais. As fontes são servidas localmente com suas licenças, sem requisições ao Google Fonts. Veja [SECURITY.md](SECURITY.md) para os limites de privacidade do armazenamento do navegador.
