# Decisões e Alternativas — Projeto Cantina

Registro das decisões técnicas e de processo tomadas ao longo da construção do projeto, com alternativas consideradas e gatilhos para revisão. Sempre que uma decisão for revisitada, atualizar a entrada existente em vez de criar uma nova.

> Cada item segue o padrão **Contexto · Alternativas · Decisão · Trade-offs · Quando revisitar**.

---

## Índice

1. Arquitetura
2. Autenticação e segurança
3. Regras de negócio
4. Documentação
5. Testes
6. CI/CD e estrutura futura
7. Convenções e organização

---

## 1. Arquitetura

### 1.1 Stack do backend

- **Contexto:** API REST para gestão de reservas, deve subir rápido e ser fácil de evoluir.
- **Alternativas:** Node.js+Express, NestJS, Fastify, Python+FastAPI.
- **Decisão:** Node.js + Express + JWT + bcryptjs + uuid + swagger-ui-express + yamljs.
- **Trade-offs:** Express é minimalista — sem opinion, mas sem magia. NestJS daria estrutura "out of the box" porém mais curva de aprendizado.
- **Quando revisitar:** se o time crescer e precisar de DI/módulos formais (NestJS), ou se performance virar gargalo (Fastify).

### 1.2 Arquitetura em camadas no backend

- **Contexto:** Necessidade de organizar código de forma escalável e testável.
- **Alternativas:** Tudo em arquivos únicos por feature; Clean Architecture; arquitetura hexagonal; camadas tradicionais.
- **Decisão:** routes → controllers → services → models, dentro de `src/`. Models acessam o banco em memória; services concentram regras de negócio; controllers só adaptam HTTP↔service.
- **Trade-offs:** É mais código que "tudo num arquivo", mas isola responsabilidades. Substituir o banco em memória por outro (Postgres, Mongo) altera só os models.
- **Quando revisitar:** ao migrar para banco real, ou se houver lógica multi-domínio que peça hexagonal.

### 1.3 Banco em memória

- **Contexto:** Projeto educacional/iterativo, não exige persistência.
- **Alternativas:** SQLite, Postgres, JSON em disco.
- **Decisão:** estruturas em memória (`db = { users, reservations, ... }`) zeradas a cada inicialização, com seed de admin + cliente exemplo.
- **Trade-offs:** Reiniciou o servidor, perdeu tudo. Aceito enquanto o foco for protótipo/avaliação. Performance e isolamento são triviais.
- **Quando revisitar:** ao precisar de persistência real, multi-instância ou histórico que dure além de um restart.

### 1.4 Stack do frontend

- **Contexto:** SPA para clientes e administradores consumirem a API.
- **Alternativas:** Vue 3, React+Vite, Svelte, Next.js, Nuxt.
- **Decisão:** Vue 3 (Composition API + `<script setup>`) + Vite + Vue Router + Pinia + Axios + Tailwind CSS.
- **Trade-offs:** Tailwind dá produtividade na estilização mas suja markup; Pinia é simples mas menos opinionado que Redux Toolkit.
- **Quando revisitar:** se houver requisito de SSR (Nuxt), ou time já dominar React.

### 1.5 Arquitetura do frontend

- **Contexto:** Manter SPA escalável conforme novas telas surgirem.
- **Alternativas:** Estrutura plana, atomic design, feature folders, services/stores/views.
- **Decisão:** Camadas `services/` (HTTP), `stores/` (Pinia: auth + notificações), `components/` (UI reutilizável), `views/` (telas).
- **Trade-offs:** Não há separação por feature — todas as views ficam num mesmo diretório. Para 10-15 telas funciona; acima disso convém migrar para feature folders.
- **Quando revisitar:** ao passar de ~20 telas ou quando dois domínios precisarem ser desacoplados visualmente.

### 1.6 CORS no backend

- **Contexto:** Frontend roda em `:5173` e API em `:3000`.
- **Alternativas:** habilitar CORS amplamente, restringir a origens específicas, usar só proxy do Vite (sem CORS no back).
- **Decisão:** `cors()` aberto no backend + proxy `/api` no Vite para dev. Origem específica deve ser configurada antes de produção.
- **Trade-offs:** CORS aberto é cômodo mas inseguro em produção. Mitigação: restringir antes do deploy.
- **Quando revisitar:** ao subir para qualquer ambiente público.

### 1.7 Proxy do Vite em dev

- **Contexto:** Evitar fricção de CORS em desenvolvimento.
- **Alternativas:** chamar a API direto com URL absoluta, configurar CORS rigorosamente desde o início.
- **Decisão:** Vite faz proxy de `/api/*` para `http://localhost:3000`. Frontend usa baseURL `/api`.
- **Trade-offs:** Em produção precisa de outro mecanismo (nginx, ingress, ou `VITE_API_BASE_URL` apontando para a API pública).
- **Quando revisitar:** ao planejar deploy de produção.

---

## 2. Autenticação e segurança

### 2.1 JWT em middleware

- **Contexto:** Necessidade de autenticar requests da API e restringir endpoints administrativos.
- **Alternativas:** sessão server-side, OAuth, basic auth, JWT em middleware.
- **Decisão:** JWT assinado com `JWT_SECRET`, expira em `JWT_EXPIRES_IN` (padrão 1d). Middleware `authenticate` injeta `req.user`; `requireAdmin` valida o role.
- **Trade-offs:** stateless, fácil de escalar. Revogação imediata de token exige denylist (não implementada).
- **Quando revisitar:** ao precisar de logout server-side, refresh tokens ou multi-fator.

### 2.2 Hash de senha

- **Contexto:** Armazenar credenciais de forma segura.
- **Alternativas:** plaintext (não), MD5/SHA1 (frágeis), bcrypt, argon2.
- **Decisão:** bcryptjs com fator 10.
- **Trade-offs:** bcrypt é amplamente suportado; argon2 é mais moderno mas exige nativo.
- **Quando revisitar:** se houver requisito de segurança elevado.

### 2.3 Bloqueio após tentativas inválidas

- **Contexto:** Mitigar brute force.
- **Alternativas:** rate limit por IP, captcha, bloqueio de conta após N tentativas.
- **Decisão:** bloqueio da conta após 5 tentativas inválidas consecutivas (`isBlocked=true`), liberado pela recuperação de senha.
- **Trade-offs:** sem rate limit por IP, atacante poderia tentar várias contas em paralelo. Aceitável em protótipo.
- **Quando revisitar:** ao subir para ambiente público — adicionar rate limit (express-rate-limit) e captcha.

### 2.4 Confirmação de e-mail e recuperação de senha

- **Contexto:** Fluxos exigem token enviado por e-mail.
- **Alternativas:** envio real (SMTP), token retornado no JSON da resposta (mock), link assinado.
- **Decisão:** mock em desenvolvimento — token retornado no payload de resposta de `/auth/register` e `/auth/forgot-password`. SMTP **não** implementado.
- **Trade-offs:** prático para testes; **inadequado para produção**.
- **Quando revisitar:** sempre que decidir habilitar produção. Já mapeado um plano: instalar `nodemailer`, criar `src/services/mail.service.js`, usar variáveis SMTP_*. Mantém comportamento atual quando essas variáveis não estiverem definidas.

---

## 3. Regras de negócio

### 3.1 Horário de corte por refeição

- **Contexto:** Originalmente havia um único `cutoffHour` (10h) para todas as refeições.
- **Alternativas:** manter único, ter um corte por refeição, ter corte por refeição+dia da semana.
- **Decisão:** corte **por refeição** (`cutoffHourByMeal: { almoco, jantar }`), configurável via `CUTOFF_HOUR_ALMOCO`/`CUTOFF_HOUR_JANTAR`. Variável legada `CUTOFF_HOUR` vira fallback. Padrões: almoço 10h, jantar 16h.
- **Trade-offs:** mais variáveis de ambiente, mensagem de erro fica explícita por refeição.
- **Quando revisitar:** se surgir requisito por dia da semana ou por categoria de cardápio.

### 3.2 Bug de "0 como falsy"

- **Contexto:** `parseInt('0') || 10` retornava 10 — deixar o corte como 0 (sem reservas para hoje) era impossível.
- **Decisão:** helper `parseIntOrUndefined` + `pick(...)` para tratar `undefined/''/NaN` distintos de `0`.
- **Quando revisitar:** ao adicionar novas variáveis numéricas — usar o mesmo padrão.

### 3.3 Estoque por refeição

- **Contexto:** Originalmente `defaultDailyStock` único (50). Quando o corte virou por refeição, fez sentido o estoque também.
- **Decisão:** `defaultDailyStockByMeal: { almoco, jantar }` configurável via `DEFAULT_DAILY_STOCK_ALMOCO`/`DEFAULT_DAILY_STOCK_JANTAR`. Padrões: 50/50.
- **Trade-offs:** estoques independentes — esgotar almoço não afeta jantar.
- **Quando revisitar:** se o cardápio expandir além de almoço/jantar.

### 3.4 Quantidade por reserva

- **Contexto:** Originalmente cada reserva representava 1 marmita. User Story já previa "5 marmitas por dia por pessoa".
- **Alternativas:** manter 1-por-reserva (cliente cria N reservas), permitir N marmitas em uma reserva.
- **Decisão:** campo `quantity` opcional (default 1, inteiro ≥ 1). Mantém-se a regra de 1 reserva por refeição/dia/usuário; o que muda é a quantidade dentro dessa reserva. Limite de 5 marmitas/dia por usuário passa a somar quantidades.
- **Trade-offs:** cliente faz 1 chamada para reservar 3 jantares (UX melhor), mas adiciona um campo no payload e na lógica de validação de estoque/limite.
- **Quando revisitar:** se houver requisito de "marmita extra" cobrada à parte ou cancelamento parcial (cancelar 1 das 3 marmitas reservadas).

### 3.5 Endpoint de disponibilidade

- **Contexto:** Frontend precisava saber estoque restante para mostrar UX rica (badges, desabilitar refeições esgotadas).
- **Alternativas:** mostrar regra estática no front, calcular sempre que tela carrega via `/reservations`, criar endpoint dedicado.
- **Decisão:** `GET /reservations/availability?date=...` retorna `{ stock, used, available, cutoffHour }` por refeição. Ressalva: `cutoffHour` foi adicionado depois para evitar hardcode no front.
- **Trade-offs:** uma chamada a mais ao mudar a data. Aceitável (resposta é leve).
- **Quando revisitar:** se virar gargalo (cache HTTP, ETag).

### 3.6 Limite diário por pessoa somando quantidades

- **Contexto:** "5 marmitas por dia" originalmente era "5 reservas". Com `quantity`, a regra mudou de cardinalidade para soma.
- **Decisão:** soma das `quantity` das reservas ativas do dia. Ordem de validações: limite por usuário antes de estoque.
- **Trade-offs:** mensagens de erro distintas explicam qual limite foi violado primeiro. Detalhes no `details` do payload de erro.

---

## 4. Documentação

### 4.1 Swagger em arquivo separado

- **Contexto:** Documentar a API de forma navegável.
- **Alternativas:** anotações JSDoc com swagger-jsdoc; arquivo OpenAPI fixo.
- **Decisão:** `resources/swagger.yaml` carregado por yamljs e servido por swagger-ui-express. UI em `/api-docs`, JSON cru em `/api-docs.json`.
- **Trade-offs:** spec fica fora do código (precisa atualizar manualmente). Vantagem: lê e valida sem rodar a API.
- **Quando revisitar:** se divergência spec↔código virar problema. Aí migrar para anotações inline.

### 4.2 README com user stories + Gherkin

- **Contexto:** Centralizar visão do produto e critérios de aceite.
- **Decisão:** README contém narrativa do projeto, instruções de execução, endpoints, regras de negócio, e as 15 User Stories com Gherkin.
- **Trade-offs:** README ficou longo (>900 linhas). Aceitável enquanto for fonte única; se virar incômodo, separar em arquivos menores em `docs/`.
- **Quando revisitar:** quando a leitura do README começar a cansar.

### 4.3 User Stories: 7 → 14 → 15

- **Contexto:** Inicialmente 7 stories. Ao longo do projeto novas funcionalidades surgiram (perfil, confirmação de e-mail, recuperação, detalhe, listagem global admin, histórico, swagger interativo, disponibilidade).
- **Decisão:** stories foram adicionadas no final do bloco do README (8 a 15).
- **Trade-offs:** stories antigas preservam numeração; novas são empilhadas. Se a ordem virar problema (ex.: priorização visual), reorganizar.

### 4.4 Decisão sobre Gherkin no README + casos de teste (status: C)

- **Contexto:** Discutimos três opções:
    - **A:** Gherkin só no doc de casos (drop do README).
    - **B:** README com 1 happy path por US, doc de casos com tudo.
    - **C:** Ambos (status quo).
- **Decisão atual:** C, com tabela `Cenário Gherkin do README → TC` no doc de casos para manter rastreabilidade.
- **Trade-offs:** pequena duplicação. Aceito enquanto a manutenção for tolerável.
- **Quando revisitar:** quando perceber edição em duplicidade frequente, quando o doc de casos crescer demais para o PO acompanhar, ou ao adotar Cucumber/SpecFlow.

---

## 5. Testes

### 5.1 Stack de testes

- **Contexto:** Definir como automatizar testes da API.
- **Alternativas:** Vitest (rápido, novo), Jest (maduro), Mocha+Chai+Supertest (clássico).
- **Decisão:** Mocha + Chai + Supertest + Mochawesome. Adicionais: sinon (fake timers), dotenv.
- **Trade-offs:** stack mais verbosa que Vitest, mas familiar e bem documentada. Mochawesome dá relatório HTML out of the box.
- **Quando revisitar:** se o time já dominar Vitest e quiser feedback mais rápido.

### 5.2 Estrutura de pasta de testes

- **Decisão:** `test/api/usXX-nome/` por User Story; `test/fixtures/` para Data Driven; `test/helpers/` para auth, http, seed, time. `.mocharc.cjs` no root da pasta `test/`.
- **Trade-offs:** divisão por US facilita rodar `--grep USXX`. Se uma US tiver muitos endpoints, cabe sub-pasta interna.

### 5.3 Hooks e isolamento

- **Decisão:** `before` global limpa estado, `beforeEach` obtém token e cria pré-condições, `after` limpa. Para regras dependentes de hora (corte), usar `sinon.useFakeTimers` — proibido `sleep` ou aguardar relógio real.
- **Trade-offs:** alguns testes ficam mais "longos" no setup, mas determinísticos.

### 5.4 Hierarquia conceitual: Condição → Cenário → Caso

- **Contexto:** Diferenciar artefatos para não confundir time.
- **Decisão:**
    - **Condição de Teste** (CTxx): genérica, "o que" testar. Vive em `4 - Condições de Teste.txt`.
    - **Cenário Gherkin no README**: declarativo, comportamento de negócio.
    - **Caso de Teste** (TCxx): concreto, com dados reais e mensagens. Vive em arquivo separado.
- **Trade-offs:** três camadas em vez de uma. Justificável quando há revisão humana entre cada etapa.

### 5.5 Casos em Gherkin (vs tabela)

- **Decisão:** casos escritos em Gherkin com cabeçalho de metadados em negrito (`**TCxx — Título** · Tipo · Camada · CTs`).
- **Trade-offs:** mais espaçado que tabela mas ganha em legibilidade, parametrização (Esquema do Cenário) e diff em PR.

### 5.6 Independência de camada com escape

- **Contexto:** Inicialmente decidimos que o caso de teste seria 100% layer-agnostic. Discussão posterior identificou ambiguidade em alguns cenários.
- **Decisão:** padrão `Camada = "Ambas"`; gerar casos específicos `API` ou `Web` somente quando o comportamento divergir entre camadas (ex.: refeição esgotada → API rejeita request; Web mostra badge e desabilita controle).
- **Trade-offs:** flexibilidade preservada sem duplicação massiva. Exige bom senso na hora de decidir quando dividir.

### 5.7 Asserção por categoria de erro

- **Contexto:** Asserir mensagem literal cria acoplamento forte com copy.
- **Decisão:** padrão é asserir pela categoria do erro em linguagem de negócio ("rejeitada por validação de dados", "rejeitada por falta de autenticação"). Mensagem literal só quando carrega informação essencial (números, limites, próxima ação).
- **Trade-offs:** menos sensível a mudanças de UX, mas perde verificação textual exata onde o copy é parte do contrato.

### 5.8 Rastreabilidade no doc de casos

- **Decisão:** ao final do doc, tabelas:
    - `CT → TC`: cobre toda Condição de Teste (independentemente da camada).
    - `Cenário Gherkin do README → TC`: cobre todo cenário do README.
    - `Resumo de cobertura`: TCs por US, total, por tipo (Positivo/Negativo/Borda/Permissão).
- **Trade-offs:** trabalho extra para manter; vira o "termômetro" da cobertura.

### 5.9 Cobertura mínima

- **Decisão:**
    - Toda CT deve ter ao menos 1 caso positivo + 1 negativo (quando admitir os dois).
    - Todo cenário Gherkin do README deve ter ≥ 1 TC.
    - Cada US com endpoint autenticado/restrito tem ≥ 1 caso de Permissão.

### 5.10 Geração dos Casos de Teste (artefato `7 - Casos de Teste.txt`)

- **Contexto:** Aplicar o prompt 6 às 15 User Stories.
- **Decisão:** documento único com 109 TCs cobrindo todas as 15 USs.
    - Distribuição por tipo: 38 Positivos, 39 Negativos, 18 Borda, 14 Permissão.
    - 9 casos parametrizados via `Esquema do Cenário` (campos obrigatórios, quantidade inválida, formatos de e-mail/CPF/data, motivo em branco, faixa de cores).
    - Mensagens literais usadas só nos TCs onde o número/limite faz parte do contrato (ex.: limite diário, estoque insuficiente).
- **Trade-offs:** documento extenso (>800 linhas), mas com rastreabilidade completa (CT→TC e Cenário Gherkin→TC).
- **Quando revisitar:** quando uma US ganhar nova regra que altere o conjunto de cenários — o ideal é reaplicar o prompt 6 só para a US afetada.

### 5.11 Escopo separado por suíte de testes (API vs Web)

- **Contexto:** Cada TC tem Camada `Ambas`/`API`/`Web`. Precisamos definir qual suíte automatiza o quê.
- **Decisão:**
    - Suíte de **API** (Mocha/Chai/Supertest, prompt 8) cobre TCs de Camada `API` + `Ambas`.
    - Suíte **Web** (Playwright, prompt 10) cobre TCs de Camada `Web` + `Ambas`.
    - TCs `Ambas` são exercitados em **ambas** as suítes — cada uma com seu binding (chamada HTTP no back vs interação UI no front).
- **Trade-offs:** TCs `Ambas` ficam duplicados no esforço de execução, mas cada suíte testa o seu lado. Não há duplicação no documento de casos.
- **Quando revisitar:** se o tempo de execução de TCs `Ambas` virar gargalo — aí pode-se optar por executar `Ambas` só na API (ganho de velocidade) e cobrir o lado UI via smoke tests no Web.

### 5.12 Tag `@destructive` para testes que alteram estado de forma irreversível

- **Contexto:** Rodar testes em ambientes compartilhados (homologação, produção) sem corromper dados.
- **Decisão:** tests que alteram estado irreversível (ex.: bloquear conta após 5 tentativas inválidas) recebem tag `@destructive` no nome do `it`/`test`. Em ambientes onde `ALLOW_DESTRUCTIVE=false`, esses testes são pulados via `--grep` invertido.
- **Trade-offs:** menos cobertura em prod. Aceito porque prod nunca é o lugar de testar fluxos destrutivos completos.

### 5.13 Multi-ambiente nos testes (modelo multi-arquivo + `TEST_ENV`)

- **Contexto:** Necessidade de rodar a mesma suíte contra dev, hml e prod sem alterar o código dos testes.
- **Alternativas:**
    - **A (atual):** múltiplos `.env` (`.env.dev`, `.env.hml`, `.env.prod`) + variável `TEST_ENV` selecionando qual carregar via helper.
    - **B (mais simples, 12-Factor):** apenas `process.env`, com um único `.env` local opcional e secrets do CI injetando direto. Discutido e ficou pendente de implementação.
- **Decisão atual:** modelo A em ambas as suítes (`test/env/` para a API, `playwright/env/` para a Web). Mesmo conjunto de variáveis (`BASE_URL`, credenciais, `ALLOW_DESTRUCTIVE`). Scripts npm dedicados (`test:dev`, `test:hml`, `test:prod`; `e2e:dev`, `e2e:hml`, `e2e:prod`). Em CI, o pipeline cria o `.env.<TEST_ENV>` no runner ou injeta direto em `process.env`.
- **Trade-offs:** mais arquivos para manter, mas a troca de ambiente fica trivial localmente (`npm run test:hml`).
- **Quando revisitar:** ao configurar o CI/CD pela primeira vez. Avaliar migração para o modelo B (mais simples, alinhado a 12-Factor) caso o time prefira.

### 5.14 Stack Playwright para a suíte Web

- **Contexto:** Definir o framework de E2E, linguagem e padrão arquitetural.
- **Alternativas:** Cypress (popular, opinionado, JS), Playwright (moderno, multi-browser, TS), TestCafé.
- **Decisão:** **@playwright/test em TypeScript**, seguindo o padrão **Page Actions + Fixtures** do projeto de referência Velo:
    - `createXxxActions(page)` — funções fábrica que retornam objetos com métodos de interação (sem classe `extends`).
    - `test.extend<{ app: App }>` — fixture que injeta `{ auth, reservation, profile, admin }` em todos os testes.
    - Execução serial (`workers: 1`, `fullyParallel: false`) para proteger o banco em memória compartilhado.
    - Nome dos tests: `TCxx — Título (CTzz)` para rastreabilidade direta com o doc de casos.
- **Trade-offs:** Playwright tem curva inicial maior que Cypress, mas multi-browser nativo, melhor isolamento, auto-wait robusto e TypeScript de primeira classe.
- **Quando revisitar:** se o time já dominar Cypress e multi-browser não for crítica.

### 5.15 Isolamento de testes via endpoint `POST /test/reset`

- **Contexto:** O banco é em memória e reiniciar o servidor a cada teste é inviável.
- **Alternativas:** (A) reiniciar o processo a cada spec; (B) seed em `beforeAll` sem reset; (C) endpoint de reset exclusivo para NODE_ENV=test.
- **Decisão:** Opção C — `POST /test/reset` (montado condicionalmente em `src/app.js` quando `NODE_ENV === test`) zera os arrays do `memoryDB` e re-executa `seedAdminUser()`. Chamado no `beforeEach` de cada spec via `resetApp()` em `playwright/support/helpers.ts`.
- **Trade-offs:** estado completamente limpo entre testes sem reiniciar o servidor. Risco: endpoint exposto em produção se `NODE_ENV` não for configurado corretamente — mitigado pelo guard condicional.
- **Quando revisitar:** ao migrar para banco real (trocar pelo padrão de transação por teste ou banco de dados de teste separado).

### 5.16 Estratégia de locators no frontend Vue

- **Contexto:** Os templates Vue usam `<label class="label">Texto</label>` sem atributo `for`, e os inputs não têm `id`. O `getByLabel()` do Playwright exige `for/id` ou label envolvendo o input.
- **Alternativas:** (A) adicionar `for/id` em todos os labels e inputs; (B) usar `getByPlaceholder()`, `locator('input[type=...]')`, `locator('select')`, `nth()` e `data-testid`; (C) usar CSS selector posicional.
- **Decisão:** Opção B — sem alterar os templates de produção para labels. Padrão adotado:
    - Inputs de autenticação/perfil → `locator('input[type="email"]')`, `locator('input[type="password"]')`, `getByPlaceholder(...)`.
    - Filtros de data → `locator('input[type="date"]').nth(0/1)`.
    - Filtro de status → `locator('select')`.
    - Elementos críticos → `data-testid` (toast, botões de ação, inputs de quantidade/motivo, badges de disponibilidade).
- **Trade-offs:** evita mudar produção; locators posicionais são frágeis se a ordem do DOM mudar. `data-testid` em elementos críticos mitiga o risco principal.
- **Quando revisitar:** ao refatorar os templates Vue para acessibilidade (adicionar `for/id`) — aí migrar para `getByLabel()`.

---

## 6. CI/CD e estrutura futura

### 6.1 Selective testing por path

- **Contexto:** Monorepo com backend e frontend; rodar tudo em todo PR é caro/lento.
- **Decisão:** filtros de path no GitHub Actions — workflows separados para `api/**`, `web/**`, e um full no `main`. Forçar rodar tudo se `package.json`, `pnpm-lock.yaml` ou `swagger.yaml` mudarem.
- **Trade-offs:** rapidez no PR, rede de segurança no `main`. Risco de quebra de contrato entre back e front mitigado por:
    - Smoke E2E que cobre 1-2 fluxos críticos.
    - Idealmente: contract tests baseados no `swagger.yaml`.
- **Quando revisitar:** ao adotar Turborepo/Nx — `affected` substitui filtros de path.

### 6.2 Estrutura futura: monorepo formal

- **Contexto:** Hoje backend está no raiz e frontend em `frontend/`. Estrutura assimétrica.
- **Decisão futura:** mover para `apps/api/` + `apps/web/` + `libs/` (compartilhados, ex.: tipos do contrato OpenAPI). Adotar npm/pnpm workspaces. Avaliar Turborepo.
- **Trade-offs:** refator de 30 minutos quando feito tudo de uma vez. Elimina path filtering manual em CI.
- **Quando revisitar:** logo após os testes da API e do front estarem estabilizados (mover com testes em pé é seguro).

### 6.3 Contract tests entre back e front (a fazer)

- **Contexto:** Mudança de contrato pode quebrar uma camada sem a outra perceber.
- **Alternativas:** Pact, Schemathesis, validação manual contra `swagger.yaml`, tipos compartilhados.
- **Decisão (planejada):** validação leve do front consumindo tipos derivados do `swagger.yaml` (`openapi-typescript` ou similar) + smoke E2E.
- **Quando implementar:** quando a API entrar em ciclo de mudança rápida.

---

## 7. Convenções e organização

### 7.1 Numeração dos prompts

- **Decisão:** prompts numerados sequencialmente em `Prompts/Planejamento e criação do software/`. Ao inserir um prompt entre dois existentes, **renumerar +1** todos os subsequentes para preservar a ordem do fluxo.
- **Aplicação atual:**
    - 1 — Prompt planejamento software (user stories)
    - 2 — Prompt criação api
    - 3 — Prompt criação cenários gherkin
    - 4 — Condições de Teste (artefato gerado)
    - 5 — Prompt criação de condições de teste
    - 6 — Prompt criação de casos de teste
    - 7 — Casos de Teste (artefato gerado)
    - 8 — Prompt de criação de testes api específico (Mocha/Chai/Supertest)
    - 9 — Criando frontend
    - 10 — Prompt criação de testes automatizados com Playwright
- **Trade-offs:** renumeração mexe nos paths. Aceitável quando o número de arquivos é pequeno (< 20).

### 7.2 Localização dos artefatos derivados

- **Decisão:** artefatos gerados a partir de prompts (ex.: `4 - Condições de Teste.txt`) ficam **na mesma pasta** dos prompts.
- **Trade-offs:** facilita comparar prompt × artefato lado a lado.

### 7.3 Nome dos arquivos de prompt

- **Decisão:** prefixo numérico, separador " - ", título em minúsculas/sem caracteres especiais.

---

## Histórico de revisões

| Data        | O que mudou |
|-------------|-------------|
| 2026-04-29  | Criação inicial: backend (Express + JWT), frontend (Vue 3 + Tailwind), 14 user stories. |
| 2026-04-29  | Cortes por refeição (almoço/jantar), depois estoque por refeição, depois quantidade por reserva. |
| 2026-04-30  | Endpoint de disponibilidade + UX dinâmica no front; Condições de Teste geradas (15 stories). |
| 2026-04-30  | Decisão sobre format dos casos de teste: Gherkin, layer-aware com escape, asserção por categoria. |
| 2026-04-30  | Plano de CI/CD com selective testing; estrutura futura `apps/api + apps/web` registrada. |
| 2026-04-30  | Decisão "Opção C" registrada para Gherkin em README + casos doc; pendência de revisitar. |
| 2026-04-30  | Prompt 6 finalizado e executado: artefato `7 - Casos de Teste.txt` produzido com 109 TCs (15 USs). |
| 2026-04-30  | Prompts renumerados após inserção do prompt 6 (antigo 7→8 testes API; antigo 8→9 frontend). |
| 2026-04-30  | Prompt 8 (Mocha/Chai/Supertest) reescrito: TC IDs nos nomes, asserção por categoria, multi-ambiente via `TEST_ENV`, tag `@destructive`. |
| 2026-04-30  | Prompt 10 (Playwright) ajustado: escopo Camada `Ambas`+`Web`, multi-ambiente espelhando o prompt 8, TC IDs nos nomes, padrão Page Objects + Actions + Fixtures. |

---

## Pendências para revisitar (atalhos)

- [ ] **SMTP real** quando preparar produção (§ 2.4).
- [ ] **CORS restrito a origens específicas** antes do deploy (§ 1.6).
- [ ] **Rate limit por IP** antes do deploy público (§ 2.3).
- [ ] **Refresh token / logout server-side** se exigir (§ 2.1).
- [ ] **Migração para `apps/api` + `apps/web`** (§ 6.2) após estabilizar testes.
- [ ] **Contract tests** baseados no Swagger (§ 6.3).
- [ ] **Persistência real (banco)** em algum momento (§ 1.3).
- [ ] **Reavaliar Opção A/B/C** para Gherkin no README (§ 4.4).
- [ ] **Vitest** vs Mocha quando o time se sentir confortável (§ 5.1).
- [ ] **Modelo multi-ambiente nos testes** (§ 5.13): avaliar migração do multi-arquivo + `TEST_ENV` para o modelo 12-Factor (`process.env` puro) ao configurar o CI/CD pela primeira vez.
- [ ] **Estratégia de execução dos TCs `Ambas`** (§ 5.11): considerar rodar `Ambas` apenas na suíte API se o tempo de execução virar gargalo no Web.
