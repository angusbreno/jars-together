# Segurança e privacidade

## Escopo da revisão

Revisão realizada em 22 de outubro de 2026 sobre o código da aplicação, armazenamento local, carregamento de recursos e workflow de publicação. Inclui testes de validação de dados, bloqueio de caminhos e cores maliciosos, ausência de interpretação de HTML dinâmico e configuração do deploy. A revisão não é uma certificação de ausência de vulnerabilidades.

## Proteções implementadas

- Aplicação estática, sem autenticação, backend, banco de dados, coleta de respostas, analytics ou dependências npm.
- Recursos da aplicação e fontes servidos pelo próprio site. As únicas requisições da aplicação são para os próprios arquivos estáticos.
- Política CSP que limita scripts, fontes e conexões à mesma origem, bloqueia scripts inline, `eval`, plugins, alteração da URL base e envio de formulários. Imagens PNG geradas no navegador usam URLs `blob:`.
- Estilos inline são permitidos para aplicar as cores escolhidas. Isso não permite JavaScript inline.
- Nomes e traduções são tratados como texto; não há atribuição a `innerHTML` nem execução de texto como código.
- Preferências salvas são reconstruídas com listas permitidas de idiomas, coleções e itens; cores e notas são validadas. Propriedades extras são descartadas.
- Links externos usam `noopener noreferrer`, e a página define `no-referrer`.
- Ações oficiais do GitHub fixadas por SHA completo, checkout sem persistir credenciais, e permissões de escrita limitadas ao job que publica o artefato. Esse job não executa o código do repositório.
- Apenas `index.html`, `.nojekyll`, os créditos e as pastas `assets/` e `locales/` são publicados no artefato do Pages. Histórico Git, testes, configurações locais e credenciais não entram no site.

## Limites relevantes

As respostas e o nome ficam em `localStorage`, sem criptografia, no dispositivo de quem usa o site. Pessoas com acesso ao perfil do navegador, extensões com permissões apropriadas ou outros scripts da mesma origem podem acessá-los. Os projetos em `angusbreno.github.io` compartilham a origem: uma pasta de projeto não isola armazenamento por site. Um domínio exclusivo seria necessário para esse isolamento adicional.

GitHub Pages gerencia HTTPS e os cabeçalhos HTTP. A CSP é aplicada por uma meta tag; proteções que exigem cabeçalhos, como `frame-ancestors`, não podem ser impostas dessa forma. Não há sessão autenticada nem operações de conta na aplicação.

A revisão não cobre o navegador do visitante, suas extensões, alterações futuras, comprometimento da conta GitHub ou a infraestrutura do GitHub. Mantenha a proteção da conta e revise futuras mudanças.

## Verificação

Execute `npm test` sem instalar dependências. Os testes de segurança estão em `tests/security.test.js`, junto dos testes de regras, idiomas e desenhos em `tests/app.test.js`.

## Proteções do repositório

O repositório usa detecção de segredos e proteção contra envio de segredos habilitadas. O token padrão de GitHub Actions tem acesso de leitura e não pode aprovar pull requests. A publicação do Pages exige HTTPS.

Para relatar uma possível vulnerabilidade sem publicá-la em uma issue, use [Report a vulnerability](https://github.com/angusbreno/jars-together/security/advisories/new).

Referências: [CSP — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) e [uso seguro de GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use).
