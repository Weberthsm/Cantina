# Cantina

[![API Tests](https://github.com/Weberthsm/Cantina/actions/workflows/api.yml/badge.svg)](https://github.com/Weberthsm/Cantina/actions/workflows/api.yml)
[![E2E Tests](https://github.com/Weberthsm/Cantina/actions/workflows/e2e.yml/badge.svg)](https://github.com/Weberthsm/Cantina/actions/workflows/e2e.yml)

Sistema de **reserva de marmitas/refeições** dividido em dois apps:

- **API REST** (Node.js + Express) — backend com regras de negócio, autenticação JWT e dados em memória.
- **Aplicação Web** (Vue 3 + Tailwind) — frontend SPA que consome a API.

A API expõe a documentação OpenAPI 3 (Swagger) em `/api-docs`, baseada no arquivo `resources/swagger.yaml`. O frontend conversa com a API por HTTP autenticado e exibe regras de negócio na própria UI (limites de reserva, horário de corte, status, etc.).

---

## Stack

### Backend (API)
- **Node.js** (>= 18)
- **Express** — framework HTTP
- **jsonwebtoken** — geração e validação dos JWTs
- **bcryptjs** — hash de senhas
- **uuid** — identificadores únicos
- **cors** — liberação de origem para o frontend
- **swagger-ui-express + yamljs** — documentação interativa

### Frontend (Web)
- **Vue 3** (Composition API + `<script setup>`)
- **Vite** — bundler e dev server
- **Vue Router** — navegação SPA com guards de autenticação/admin
- **Pinia** — estado global (auth + notificações)
- **Axios** — cliente HTTP com interceptors centralizados
- **Tailwind CSS** — estilização utilitária

---

## Estrutura de pastas

```
Cantina/
├── package.json                   # Backend (Express)
├── server.js                      # Bootstrap: inicia o servidor
├── README.md
├── resources/
│   └── swagger.yaml               # Especificação OpenAPI 3.0 da API
├── src/                           # Código do backend (API)
│   ├── app.js                     # Configuração do Express, CORS e Swagger
│   ├── config/
│   │   └── index.js               # Configurações (JWT, regras de negócio, papéis, statuses)
│   ├── database/
│   │   ├── memoryDB.js            # Banco em memória (arrays/objetos)
│   │   └── seed.js                # Cria admin + cliente exemplo
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Autenticação JWT + autorização admin
│   │   └── error.middleware.js    # Tratamento central de erros
│   ├── models/                    # Acesso aos dados do banco em memória
│   │   ├── user.model.js
│   │   ├── reservation.model.js
│   │   └── history.model.js
│   ├── services/                  # Regras de negócio
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   └── reservation.service.js
│   ├── controllers/               # Adaptadores HTTP -> service
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── reservation.controller.js
│   ├── routes/                    # Definição de endpoints
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── reservation.routes.js
│   └── utils/
│       ├── AppError.js            # Erro de aplicação com status/code
│       └── dateUtils.js           # Helpers de data (corte, hoje, ISO)
└── frontend/                      # Aplicação Web (Vue 3 + Tailwind)
    ├── package.json
    ├── vite.config.js             # Proxy /api -> http://localhost:3000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.js + App.vue
        ├── assets/main.css        # Diretivas Tailwind + classes utilitárias
        ├── router/                # Vue Router + guards (auth/admin)
        ├── services/              # http (axios + interceptors), auth/user/reservation
        ├── stores/                # Pinia: auth (token + user) e notifications (toasts)
        ├── components/            # AppLayout, Navbar, Toast, ReservationCard, ConfirmDialog…
        └── views/                 # Login, Register, ConfirmEmail, Forgot/Reset, Dashboard,
                                   #   Reservations, NewReservation, Profile, Admin
```

No backend, a divisão em **routes → controllers → services → models** isola responsabilidades e facilita evoluir o projeto (trocar o banco em memória por um banco real, por exemplo).

No frontend, a divisão em **services → stores → components/views** mantém a aplicação escalável: novas telas reutilizam os mesmos clientes HTTP e stores; novos endpoints se traduzem em mais um service.

---

## Como executar

```bash
# 1. Instalar dependências
npm install

# 2. (Opcional) copiar variáveis de ambiente
cp .env.example .env

# 3. Subir a API
npm start
```

A API sobe por padrão em `http://localhost:3000`. A documentação Swagger fica em `http://localhost:3000/api-docs`.

### Usuários pré-cadastrados (seed)

| Perfil | E-mail              | Senha        |
|--------|---------------------|--------------|
| admin  | admin@cantina.com   | Admin@123    |
| cliente| cliente@cantina.com | Cliente@123  |

Os dois já são `isEmailConfirmed: true` para facilitar testes.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste se necessário.

| Variável                         | Padrão                          | Descrição                                       |
|----------------------------------|---------------------------------|-------------------------------------------------|
| `PORT`                           | `3000`                          | Porta HTTP                                      |
| `JWT_SECRET`                     | `cantina-secret-dev-change-me`  | Segredo usado para assinar os JWTs              |
| `JWT_EXPIRES_IN`                 | `1d`                            | Validade do JWT                                 |
| `MAX_RESERVATIONS_PER_USER_PER_DAY` | `5`                          | Limite de marmitas por usuário/dia              |
| `DEFAULT_DAILY_STOCK_ALMOCO`     | `50`                            | Estoque diário máximo de **almoços**            |
| `DEFAULT_DAILY_STOCK_JANTAR`     | `50`                            | Estoque diário máximo de **jantares**           |
| `DEFAULT_DAILY_STOCK`            | —                               | (Legado) Se definida, vira o padrão para qualquer refeição |
| `CUTOFF_HOUR_ALMOCO`             | `10`                            | Hora de corte para reservar/cancelar **almoço** no dia |
| `CUTOFF_HOUR_JANTAR`             | `16`                            | Hora de corte para reservar/cancelar **jantar** no dia |
| `CUTOFF_HOUR`                    | —                               | (Legado) Se definida, vira o padrão para qualquer refeição |

---

## Autenticação

O middleware `authenticate` (em `src/middlewares/auth.middleware.js`) valida o header `Authorization: Bearer <token>`. Após `POST /auth/login` o cliente recebe o JWT e o utiliza nas requisições subsequentes.

- Token expirado/inválido → `401 Unauthorized`
- Usuário bloqueado (5 falhas consecutivas) → `423 Locked` no login, `403 Forbidden` ao usar o token
- Endpoints administrativos passam adicionalmente pelo `requireAdmin` que devolve `403 Forbidden` para usuários comuns

A recuperação de senha gera um token (`POST /auth/forgot-password`) e zera o bloqueio quando a senha é redefinida (`POST /auth/reset-password`).

---

## Endpoints principais

| Método | Rota                                  | Quem usa     | Descrição                                              |
|--------|---------------------------------------|--------------|--------------------------------------------------------|
| GET    | `/`                                   | público      | Metadados da API                                       |
| GET    | `/api-docs`                           | público      | Swagger UI                                             |
| GET    | `/api-docs.json`                      | público      | Documento OpenAPI bruto                                |
| POST   | `/auth/register`                      | público      | Cadastro de cliente                                    |
| GET    | `/auth/confirm-email/:token`          | público      | Confirma e-mail do cadastro                            |
| POST   | `/auth/login`                         | público      | Login (retorna JWT)                                    |
| POST   | `/auth/forgot-password`               | público      | Solicita token de recuperação                          |
| POST   | `/auth/reset-password`                | público      | Redefine senha                                         |
| GET    | `/users/me`                           | autenticado  | Perfil do usuário                                      |
| PATCH  | `/users/me`                           | autenticado  | Atualiza nome, cpf, telefone, endereço                 |
| POST   | `/reservations`                       | autenticado  | Cria reserva                                           |
| GET    | `/reservations?from&to&all`           | autenticado  | Lista reservas (próprias; admin pode usar `all=true`) |
| GET    | `/reservations/availability?date`     | autenticado  | Estoque/usado/disponível por refeição na data         |
| GET    | `/reservations/:id`                   | autenticado  | Detalhe de reserva                                     |
| DELETE | `/reservations/:id`                   | autenticado  | Cancelamento pelo cliente                              |
| PATCH  | `/reservations/:id/deliver`           | admin        | Marca reserva como entregue                            |
| PATCH  | `/reservations/:id/admin-cancel`      | admin        | Cancelamento pelo administrador (com motivo)           |
| GET    | `/reservations/history?reservationId` | admin        | Histórico de cancelamentos                             |

---

## Códigos de erro

Todas as respostas de erro seguem o formato:

```json
{
  "error": "ValidationError",
  "message": "E-mail em formato inválido.",
  "details": null
}
```

| Status | Quando ocorre                                                                 |
|--------|--------------------------------------------------------------------------------|
| 400    | Validação ou regra de negócio (data passada, corte vencido, dados inválidos)  |
| 401    | Credenciais incorretas, token ausente/inválido/expirado                        |
| 403    | Acesso negado (e.g. cliente tentando rota admin, e-mail não confirmado)        |
| 404    | Recurso não encontrado                                                         |
| 409    | Conflito (estoque esgotado, reserva duplicada, status inválido)                |
| 423    | Usuário bloqueado por excesso de tentativas                                    |
| 500    | Erro inesperado                                                                |

---

## Regras de negócio implementadas

A API implementa as user stories descritas a seguir.

### 1. Login de usuário
- E-mail e senha obrigatórios.
- Após **5 tentativas inválidas consecutivas** o usuário fica bloqueado (`423 Locked`).
- Apenas usuários com e-mail confirmado podem logar.
- Recuperação de senha por token desbloqueia o usuário.

### 2. Cadastro de reservas
- Reservas aceitam o campo opcional `quantity` (inteiro ≥ 1; padrão 1).
- Limite de 5 **marmitas** por usuário por dia (soma das quantidades das reservas ativas).
- 1 reserva por refeição (`almoco`, `jantar`) por usuário no dia (com a quantidade que couber no limite diário e no estoque).
- Horário de corte **por refeição** para reservas do mesmo dia (padrão: almoço até 10h, jantar até 16h; configurável por `.env`).
- Estoque diário **por refeição** (padrão: 50 almoços e 50 jantares; configurável por `.env`). O estoque é descontado pela quantidade pedida.
- Não permite reservar para datas passadas.
- Exige nome, CPF, telefone e endereço cadastrados (`PATCH /users/me`).
- Reservas estão sempre vinculadas ao usuário autenticado.

### 3. Cancelamento de reservas (cliente)
- Apenas reservas próprias.
- Apenas antes do horário de corte da **respectiva refeição** no dia da reserva (almoço até 10h, jantar até 16h por padrão).
- Estoque é "liberado" automaticamente (a contagem só considera reservas ativas).
- Histórico de cancelamentos é mantido.

### 4. Consulta por data
- Cliente vê apenas suas próprias reservas; admin pode usar `all=true`.
- Filtro por intervalo `from`/`to`.
- Resultados ordenados por data ascendente.
- Status retornado: `ativa`, `cancelada`, `entregue`.

### 5. Marcar como entregue (admin)
- Apenas administradores.
- Apenas reservas com status `ativa`.
- Após entregue, a reserva não pode ser alterada nem cancelada.
- Registra `deliveredAt` e `deliveredBy`.

### 6. Cancelamento pelo administrador
- Apenas administradores.
- Aceito mesmo após o horário de corte.
- Motivo é obrigatório.
- Histórico mantido.
- Reservas entregues não podem ser canceladas.
- Notificação ao cliente é registrada em log (mock de envio).

### 7. Cadastro de cliente
- Nome, e-mail e senha obrigatórios. Senha com no mínimo 6 caracteres.
- E-mail único e em formato válido.
- Confirmação de e-mail antes do login (token retornado em desenvolvimento para facilitar testes).
- Senha armazenada com `bcrypt`.

### 8. Consulta de disponibilidade
- `GET /reservations/availability?date=YYYY-MM-DD` retorna `{ stock, used, available }` por refeição.
- `used` conta apenas reservas com status `ativa` (canceladas e entregues não consomem estoque).
- `stock` reflete `DEFAULT_DAILY_STOCK_ALMOCO`/`DEFAULT_DAILY_STOCK_JANTAR` (com fallback `DEFAULT_DAILY_STOCK` e padrão 50).
- O frontend usa esse endpoint na tela de **Nova reserva** para mostrar badges "X disponíveis", "Quase esgotado" ou "Esgotado", desabilitar refeições zeradas e recarregar automaticamente após uma falha de criação.

---

## Exemplos rápidos (cURL)

```bash
# Login (cliente exemplo)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@cantina.com","password":"Cliente@123"}'

# Resposta: { "token": "...", "user": { ... } }

# Atualizar perfil (CPF, telefone, endereço) — necessário antes de reservar
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678900","phone":"11999999999","address":"Rua Exemplo, 123"}'

# Criar reserva (1 marmita por padrão)
curl -X POST http://localhost:3000/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-15","mealType":"almoco"}'

# Criar reserva com quantidade (até o limite diário do usuário e do estoque)
curl -X POST http://localhost:3000/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-15","mealType":"jantar","quantity":2}'

# Listar reservas no intervalo
curl "http://localhost:3000/reservations?from=2026-05-01&to=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"

# Consultar disponibilidade do dia (estoque/usado/disponível por refeição)
curl "http://localhost:3000/reservations/availability?date=2026-05-15" \
  -H "Authorization: Bearer $TOKEN"
# Resposta: { "date":"2026-05-15", "almoco":{"stock":50,"used":12,"available":38}, "jantar":{...} }
```

---

## Testes E2E (Playwright)

A suíte E2E cobre todos os TCs com Camada **Web** ou **Ambas** do documento de casos de teste — 41 testes distribuídos em 14 arquivos de spec, um por User Story.

### Stack

- **@playwright/test** (TypeScript) — framework de E2E
- Padrão **Page Actions + Fixtures** (`test.extend`) — mesmo padrão do projeto de referência Velo
- Multi-ambiente via `playwright/env/.env.dev|hml|prod`
- Reporter HTML nativo do Playwright

### Estrutura

```
playwright/
├── playwright.config.ts          # Config principal (timeout, reporter, baseURL, webServer)
├── tsconfig.json
├── env/
│   ├── .env.example
│   ├── .env.dev                  # BASE_URL, API_BASE_URL, credenciais
│   └── .env.hml
├── support/
│   ├── fixtures.ts               # test.extend com auth, reservation, profile, admin
│   ├── helpers.ts                # resetApp(), uniqueEmail(), tomorrow(), loginViaAPI(), ...
│   └── actions/
│       ├── authActions.ts        # login, register, forgotPassword, resetPassword, confirmEmail
│       ├── reservationActions.ts # nova reserva, listar, cancelar, filtrar, disponibilidade
│       ├── profileActions.ts     # ver perfil, atualizar perfil
│       └── adminActions.ts       # marcar entregue, cancelar admin, histórico, filtros
└── specs/
    ├── us01-login/
    ├── us02-cadastro-reservas/
    ├── us03-cancelamento-cliente/
    ├── us04-consulta-reservas/
    ├── us05-marcar-entregue/
    ├── us06-cancelamento-admin/
    ├── us07-cadastro-cliente/
    ├── us08-confirmacao-email/
    ├── us09-recuperacao-senha/
    ├── us10-perfil/
    ├── us11-detalhe-reserva/
    ├── us12-listagem-global-admin/
    ├── us13-historico-cancelamentos/
    └── us15-disponibilidade/
```

### Pré-requisitos

**1. Instalar dependências** (necessário apenas uma vez após clonar ou atualizar o projeto):

```bash
npm install
```

**2. Instalar os browsers do Playwright** (necessário apenas uma vez, ou após atualizar o `@playwright/test`):

```bash
# Sempre use o binário local para garantir a versão correta
node_modules\.bin\playwright install
```

> ⚠️ **Não use `npx playwright install`** — ele pode instalar uma versão diferente da exigida pelo projeto e deixar de instalar o `Chrome Headless Shell` necessário para o modo padrão (headless).

**3. Preparar o arquivo de ambiente** (necessário apenas uma vez):

```bash
cp playwright/env/.env.example playwright/env/.env.dev
# Edite playwright/env/.env.dev se necessário (as credenciais padrão já são as do seed)
```

**4. Liberar a porta 3000**

O Playwright sobe o backend automaticamente com `NODE_ENV=test`. Se houver outro processo usando a porta 3000 (ex.: servidor iniciado pelo VS Code), a execução falhará com um erro de porta ocupada. Encerre-o antes de rodar os testes.

### Como executar

```bash
# Todos os testes — o Playwright sobe o backend e o frontend automaticamente
npm run e2e

# Com o browser visível (modo headed — útil para depurar)
npm run e2e:headed

# Por ambiente
npm run e2e:dev
npm run e2e:hml

# Apenas uma User Story (ex.: US01)
npm run e2e:us -- --grep "US01"

# Abrir relatório HTML da última execução
npm run e2e:report
```

> O Playwright inicia o backend (`node server.js` com `NODE_ENV=test`) e o frontend (`npm run dev`) antes dos testes e os encerra ao terminar. Não é necessário subir nada manualmente.

### Isolamento entre testes

Cada `beforeEach` chama `POST /test/reset` (endpoint exclusivo `NODE_ENV=test`), que limpa o banco em memória e re-executa o seed. Setup de estado complexo (criar reservas, completar perfil) é feito via chamadas diretas à API (`loginViaAPI`, `createReservationViaAPI`, `updateProfileViaAPI`) — sem passar pela UI — para manter os testes rápidos e determinísticos.

---

# User Stories - Sistema de Reserva de Marmitas

## 1. Login de usuário

**Como usuário**
Quero realizar login no sistema
Para acessar minhas reservas de forma segura

**Regras de negócio:**
- O usuário deve informar e-mail e senha válidos.
- O sistema deve bloquear o acesso após 5 tentativas inválidas consecutivas.
- Apenas usuários cadastrados podem realizar login.
- Deve existir opção de recuperação de senha via e-mail.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Login com credenciais válidas
  Dado que sou um usuário cadastrado e com e-mail confirmado
  Quando informo meu e-mail e minha senha corretos
  Então sou autenticado com sucesso
  E recebo um token de acesso

Cenário: Login com senha incorreta
  Dado que sou um usuário cadastrado
  Quando informo minha senha incorretamente
  Então o login é rejeitado
  E vejo a mensagem "Credenciais inválidas."

Cenário: Login com e-mail não cadastrado
  Quando tento fazer login com um e-mail que não existe
  Então o login é rejeitado
  E vejo a mensagem "Credenciais inválidas."

Cenário: Bloqueio após cinco tentativas inválidas consecutivas
  Dado que sou um usuário cadastrado
  E já tenho 4 tentativas de login inválidas consecutivas
  Quando informo a senha incorretamente mais uma vez
  Então minha conta é bloqueada
  E vejo a mensagem "Usuário bloqueado por excesso de tentativas. Recupere a senha para desbloquear."

Cenário: Login bloqueado por e-mail ainda não confirmado
  Dado que me cadastrei mas ainda não confirmei meu e-mail
  Quando informo minhas credenciais corretas
  Então o login é rejeitado
  E vejo a mensagem "E-mail ainda não confirmado. Confirme o cadastro antes de logar."

Cenário: Login sem informar campos obrigatórios
  Quando tento fazer login sem informar e-mail e senha
  Então o login é rejeitado
  E vejo a mensagem "E-mail e senha são obrigatórios."
```

---

## 2. Cadastro de reservas

**Como cliente**
Quero reservar marmitas para uma data específica
Para garantir minha refeição antecipadamente

**Regras de negócio:**
- O cliente pode informar a **quantidade de marmitas** por reserva (campo `quantity`, padrão 1).
- O cliente só pode reservar até o limite máximo de marmitas por dia (ex: 5 por pessoa). O limite é somado considerando as quantidades de todas as reservas ativas do dia.
- As reservas devem respeitar o **horário de corte por refeição** (padrão: almoço até 10h, jantar até 16h, configurável por refeição).
- O sistema deve validar a disponibilidade de **estoque por refeição** antes de confirmar a reserva (padrão 50 almoços e 50 jantares por dia, configurável por refeição). O estoque é descontado pela quantidade pedida.
- Não permitir reservas para datas passadas.
- Um usuário só pode ter 1 reserva por refeição(almoço, jantar) no dia
- Deve confirmar reserva com sucesso quando válida
- Deve garantir coleta de nome, cpf, endereço e telefone do cliente
- Cada reserva deve estar vinculada a um usuário autenticado.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Reserva válida para refeição futura
  Dado que sou um cliente autenticado com nome, CPF, endereço e telefone cadastrados
  E ainda não tenho reserva ativa para a refeição escolhida na data alvo
  E o estoque do dia para essa refeição não está esgotado
  Quando reservo a refeição para uma data futura
  Então a reserva é confirmada com status "ativa"

Cenário: Tentativa de reservar para data passada
  Dado que sou um cliente autenticado com perfil completo
  Quando reservo uma refeição para uma data anterior a hoje
  Então a reserva é rejeitada
  E vejo a mensagem "Não é permitido reservar para datas passadas."

Cenário: Reserva no mesmo dia após o horário de corte da refeição
  Dado que sou um cliente autenticado com perfil completo
  E já se passou do horário de corte da refeição escolhida (ex.: 10h para almoço, 16h para jantar)
  Quando reservo essa refeição para hoje
  Então a reserva é rejeitada
  E vejo uma mensagem informando que o horário de corte da refeição já foi ultrapassado

Cenário: Reserva de jantar para hoje após o corte do almoço (mas antes do corte do jantar)
  Dado que sou um cliente autenticado com perfil completo
  E são 11h (após o corte do almoço, mas antes do corte do jantar)
  Quando reservo um jantar para hoje
  Então a reserva é confirmada com status "ativa"

Cenário: Cliente reserva múltiplas marmitas em uma mesma reserva
  Dado que sou um cliente autenticado com perfil completo
  E o estoque do jantar tem mais de 2 vagas
  E ainda não tenho reserva ativa de jantar nesse dia
  Quando reservo 2 jantares para uma data futura
  Então a reserva é confirmada com status "ativa"
  E a reserva criada registra a quantidade igual a 2

Cenário: Cliente excede o limite diário de marmitas somando quantidades
  Dado que sou um cliente autenticado com perfil completo
  E já tenho 2 jantares ativos para a data escolhida
  Quando tento reservar mais 4 almoços para o mesmo dia
  Então a reserva é rejeitada
  E vejo a mensagem "Limite de 5 marmitas por dia atingido. Você ainda pode reservar 3."

Cenário: Cliente respeita o limite diário usando quantidade
  Dado que sou um cliente autenticado com perfil completo
  E já tenho 2 jantares ativos para a data escolhida
  Quando reservo 3 almoços para o mesmo dia
  Então a reserva é confirmada com status "ativa"

Cenário: Quantidade inválida (zero ou não-inteiro)
  Dado que sou um cliente autenticado com perfil completo
  Quando tento reservar uma quantidade que não seja inteiro maior ou igual a 1
  Então a reserva é rejeitada
  E vejo a mensagem "Quantidade inválida. Informe um inteiro maior ou igual a 1."

Cenário: Cliente tenta duplicar a mesma refeição no dia
  Dado que sou um cliente autenticado com perfil completo
  E já tenho reserva ativa para o jantar do dia escolhido
  Quando tento reservar outro jantar para o mesmo dia
  Então a reserva é rejeitada
  E vejo a mensagem "Você já possui uma reserva ativa de jantar nesse dia."

Cenário: Estoque do almoço esgotado em uma data
  Dado que sou um cliente autenticado com perfil completo
  E o estoque de almoço da data alvo está esgotado
  Quando tento reservar um almoço para essa data
  Então a reserva é rejeitada
  E vejo uma mensagem informando que o estoque de almoço daquele dia se esgotou

Cenário: Quantidade pedida maior do que o estoque restante
  Dado que sou um cliente autenticado com perfil completo
  E o estoque de jantar da data alvo é 3 e ainda não houve reservas
  Quando tento reservar 4 jantares para essa data
  Então a reserva é rejeitada com a mensagem "Estoque insuficiente para jantar no dia <data>. Restam 3 de 3."

Cenário: Estoque do almoço esgotado não impede reserva de jantar
  Dado que sou um cliente autenticado com perfil completo
  E o estoque de almoço da data alvo está esgotado
  E o estoque de jantar da mesma data ainda tem vagas
  Quando reservo um jantar para essa data
  Então a reserva é confirmada com status "ativa"

Cenário: Cliente sem perfil completo tenta reservar
  Dado que sou um cliente autenticado com CPF, endereço e telefone ainda não preenchidos
  Quando tento criar uma reserva
  Então a reserva é rejeitada
  E vejo uma mensagem indicando os campos do perfil que estão faltando

Esquema do Cenário: Tipos de refeição aceitos
  Dado que sou um cliente autenticado com perfil completo
  E não tenho reserva ativa para a refeição escolhida na data alvo
  Quando reservo uma refeição do tipo "<mealType>" para uma data futura
  Então o resultado é <resultado>

  Exemplos:
    | mealType | resultado                                                              |
    | almoco   | a reserva é confirmada                                                 |
    | jantar   | a reserva é confirmada                                                 |
    | cafe     | a reserva é rejeitada com a mensagem "Tipo de refeição inválido"      |
```

---

## 3. Cancelamento de reservas

**Como cliente**
Quero cancelar uma reserva
Para evitar cobranças ou desperdícios quando não precisar mais da refeição

**Regras de negócio:**
- O cancelamento só pode ser realizado antes do horário de corte.
- O sistema deve atualizar automaticamente o estoque após o cancelamento.
- O cliente só pode cancelar reservas próprias.
- O sistema deve registrar o histórico de cancelamentos.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Cancelamento antes do horário de corte
  Dado que sou o cliente dono de uma reserva ativa
  E ainda não passou do horário de corte do dia da reserva
  Quando cancelo a reserva
  Então a reserva fica com status "cancelada"
  E o cancelamento é registrado no histórico

Cenário: Tentativa de cancelar reserva de outro cliente
  Dado que existe uma reserva ativa pertencente a outro cliente
  Quando tento cancelar essa reserva
  Então o cancelamento é rejeitado
  E vejo a mensagem "Você só pode cancelar reservas próprias."

Cenário: Cancelamento após o horário de corte da refeição
  Dado que sou o cliente dono de uma reserva ativa para hoje
  E já passou do horário de corte da refeição daquela reserva (ex.: 10h para almoço, 16h para jantar)
  Quando tento cancelar a reserva
  Então o cancelamento é rejeitado
  E vejo uma mensagem informando que o cancelamento só é permitido antes do horário de corte daquela refeição

Cenário: Tentativa de cancelar reserva já entregue
  Dado que sou o cliente dono de uma reserva já entregue
  Quando tento cancelar a reserva
  Então o cancelamento é rejeitado
  E vejo a mensagem "Reservas entregues não podem ser canceladas."

Cenário: Tentativa de cancelar uma reserva já cancelada
  Dado que sou o cliente dono de uma reserva já cancelada
  Quando tento cancelá-la novamente
  Então a operação é rejeitada
  E vejo a mensagem "Reserva já cancelada."
```

---

## 4. Consultar reservas por data

**Como cliente**
Quero consultar minhas reservas por data
Para acompanhar os pedidos realizados

**Regras de negócio:**
- O usuário só pode visualizar suas próprias reservas.
- Deve ser possível filtrar por intervalo de datas.
- O sistema deve exibir o status da reserva (ativa, cancelada, entregue).
- A consulta deve retornar resultados ordenados por data.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Cliente consulta suas reservas em um intervalo
  Dado que sou um cliente autenticado com reservas em diversas datas
  Quando consulto minhas reservas filtrando por intervalo de datas
  Então recebo apenas reservas próprias dentro do intervalo
  E os resultados estão ordenados por data ascendente

Cenário: Cliente não enxerga reservas de terceiros
  Dado que existem reservas de outros clientes
  Quando consulto a listagem de reservas
  Então vejo apenas as reservas que eu mesmo criei

Cenário: Status visível em cada reserva
  Dado que tenho reservas com status "ativa", "cancelada" e "entregue"
  Quando consulto minhas reservas
  Então cada reserva exibe seu status atual

Cenário: Filtro com intervalo em formato inválido
  Quando consulto minhas reservas informando uma data inicial em formato inválido
  Então a consulta é rejeitada
  E vejo uma mensagem indicando que o formato esperado é "YYYY-MM-DD"
```

---

## 5. Marcar como entregue

**Como administrador**
Quero marcar uma reserva como entregue
Para controlar quais pedidos já foram finalizados

**Regras de negócio:**
- Apenas usuários com perfil de administrador podem marcar como entregue.
- Só é possível marcar reservas com status “ativa”.
- Após marcada como entregue, a reserva não pode ser alterada ou cancelada.
- O sistema deve registrar data e hora da entrega.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Administrador marca reserva ativa como entregue
  Dado que sou um administrador autenticado
  E existe uma reserva com status "ativa"
  Quando marco essa reserva como entregue
  Então a reserva passa a ter status "entregue"
  E a data e hora da entrega são registradas

Cenário: Cliente tenta marcar uma reserva como entregue
  Dado que sou um cliente autenticado
  Quando tento marcar uma reserva como entregue
  Então a operação é rejeitada
  E vejo a mensagem "Apenas administradores podem acessar este recurso."

Cenário: Tentativa de entregar uma reserva já entregue
  Dado que sou um administrador autenticado
  E existe uma reserva com status "entregue"
  Quando tento marcá-la como entregue novamente
  Então a operação é rejeitada
  E vejo uma mensagem informando que apenas reservas ativas podem ser entregues

Cenário: Tentativa de entregar uma reserva cancelada
  Dado que sou um administrador autenticado
  E existe uma reserva com status "cancelada"
  Quando tento marcá-la como entregue
  Então a operação é rejeitada
  E vejo uma mensagem informando que apenas reservas ativas podem ser entregues
```

---

## 6. Cancelamento de reservas pelo administrador

**Como administrador**
Quero cancelar reservas de clientes
Para corrigir erros, lidar com indisponibilidade ou situações excepcionais

**Regras de negócio:**
- Apenas usuários com perfil de administrador podem cancelar reservas de terceiros.
- O administrador pode cancelar reservas mesmo após o horário de corte.
- O sistema deve atualizar automaticamente o estoque após o cancelamento.
- O sistema deve registrar o motivo do cancelamento.
- O sistema deve manter o histórico de cancelamentos realizados pelo administrador.
- O cliente deve ser notificado quando sua reserva for cancelada pelo administrador.
- Reservas já marcadas como “entregue” não podem ser canceladas.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Administrador cancela reserva com motivo
  Dado que sou um administrador autenticado
  E existe uma reserva ativa de um cliente
  Quando cancelo essa reserva informando um motivo
  Então a reserva fica com status "cancelada"
  E o motivo é registrado no histórico
  E o cliente recebe uma notificação do cancelamento

Cenário: Administrador cancela reserva após o horário de corte
  Dado que sou um administrador autenticado
  E já passou do horário de corte do dia da reserva
  Quando cancelo a reserva informando um motivo
  Então a reserva fica com status "cancelada"

Cenário: Administrador tenta cancelar sem informar motivo
  Dado que sou um administrador autenticado
  Quando tento cancelar uma reserva sem informar o motivo
  Então o cancelamento é rejeitado
  E vejo a mensagem "Motivo do cancelamento é obrigatório."

Cenário: Administrador tenta cancelar reserva já entregue
  Dado que sou um administrador autenticado
  E existe uma reserva com status "entregue"
  Quando tento cancelá-la
  Então o cancelamento é rejeitado
  E vejo a mensagem "Reservas entregues não podem ser canceladas."

Cenário: Cliente tenta usar a operação administrativa de cancelamento
  Dado que sou um cliente autenticado
  Quando tento usar a operação de cancelamento administrativo
  Então a operação é rejeitada
  E vejo a mensagem "Apenas administradores podem acessar este recurso."
```

---

## 7. Cadastro de cliente

**Como cliente**
Quero me cadastrar no sistema
Para poder realizar reservas de marmitas

**Regras de negócio:**
- O cadastro deve exigir dados mínimos: nome completo, e-mail e senha.
- O e-mail deve ser único no sistema.
- A senha deve possuir no mínimo 6 caracteres.
- O sistema deve validar o formato do e-mail.
- O cliente deve confirmar o cadastro via e-mail antes de acessar o sistema.
- O sistema deve armazenar a senha de forma segura (criptografada).
- Não permitir cadastro com campos obrigatórios em branco.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Cadastro válido
  Quando me cadastro informando nome completo, e-mail válido e senha com pelo menos 6 caracteres
  Então o cadastro é aceito
  E recebo a orientação de confirmar meu e-mail antes de fazer login

Cenário: Cadastro com e-mail já utilizado
  Dado que já existe uma conta com o e-mail "joao@example.com"
  Quando tento me cadastrar usando esse mesmo e-mail
  Então o cadastro é rejeitado
  E vejo a mensagem "E-mail já cadastrado."

Cenário: Cadastro com e-mail em formato inválido
  Quando me cadastro informando "joao.example.com" como e-mail
  Então o cadastro é rejeitado
  E vejo a mensagem "E-mail em formato inválido."

Cenário: Cadastro com senha curta
  Quando me cadastro informando uma senha com menos de 6 caracteres
  Então o cadastro é rejeitado
  E vejo a mensagem "A senha deve possuir no mínimo 6 caracteres."

Cenário: Cadastro com nome em branco
  Quando me cadastro sem informar o nome
  Então o cadastro é rejeitado
  E vejo a mensagem "Nome completo é obrigatório."

Esquema do Cenário: Validação dos campos obrigatórios
  Quando me cadastro com o campo "<campo>" no valor "<valor>"
  Então o cadastro é rejeitado com a mensagem "<mensagem>"

  Exemplos:
    | campo | valor               | mensagem                                       |
    | nome  |                     | Nome completo é obrigatório.                   |
    | email |                     | E-mail é obrigatório.                          |
    | email | joao.example.com    | E-mail em formato inválido.                    |
    | senha | 123                 | A senha deve possuir no mínimo 6 caracteres.   |
```

---

## 8. Confirmação de cadastro por e-mail

**Como cliente recém-cadastrado**
Quero confirmar meu e-mail por meio de um link/token enviado pelo sistema
Para ativar minha conta e poder fazer login

**Regras de negócio:**
- O sistema gera um token único de confirmação ao concluir o cadastro.
- O token é enviado ao e-mail do usuário (em ambiente de desenvolvimento o token também é retornado na resposta do cadastro para facilitar testes).
- Tentativas de login com a conta ainda não confirmada devem ser bloqueadas (`403 Forbidden`).
- Após confirmação bem-sucedida o token é invalidado e não pode ser reutilizado.
- Tokens inválidos ou já utilizados devem retornar erro de validação.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Confirmação de e-mail com token válido
  Dado que acabei de me cadastrar e recebi um token de confirmação
  Quando confirmo meu e-mail informando esse token
  Então minha conta passa a estar confirmada
  E posso realizar login

Cenário: Tentativa de confirmação com token inválido
  Quando tento confirmar meu e-mail informando um token desconhecido
  Então a confirmação é rejeitada
  E vejo a mensagem "Token de confirmação inválido ou expirado."

Cenário: Reuso de token já consumido
  Dado que já confirmei meu e-mail anteriormente com determinado token
  Quando tento usar o mesmo token novamente
  Então a confirmação é rejeitada
  E vejo a mensagem "Token de confirmação inválido ou expirado."

Cenário: Login bloqueado para conta sem confirmação
  Dado que me cadastrei mas ainda não confirmei meu e-mail
  Quando tento fazer login
  Então o login é rejeitado
  E vejo a mensagem "E-mail ainda não confirmado. Confirme o cadastro antes de logar."
```

---

## 9. Recuperação de senha

**Como usuário que esqueceu a senha (ou foi bloqueado por excesso de tentativas)**
Quero solicitar a redefinição da minha senha
Para voltar a acessar minha conta

**Regras de negócio:**
- A solicitação aceita o e-mail do usuário e gera um token de recuperação com prazo de validade (30 minutos).
- A resposta é silenciosa quanto à existência do e-mail (não vaza informação a respeito de cadastro).
- Em ambiente de desenvolvimento o token é retornado na resposta para facilitar testes.
- Ao redefinir a senha com o token válido, o sistema:
    - Atualiza a senha (mínimo de 6 caracteres) com hash seguro.
    - Zera o contador de tentativas de login inválidas.
    - Desbloqueia o usuário caso ele esteja bloqueado.
    - Invalida o token de recuperação após o uso.
- Tokens expirados ou inválidos devem retornar erro de validação.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Solicitação de recuperação de senha bem-sucedida
  Dado que sou um usuário cadastrado
  Quando solicito a recuperação de senha do meu e-mail
  Então recebo um token de recuperação válido por 30 minutos

Cenário: Redefinição de senha com token válido
  Dado que possuo um token de recuperação válido
  Quando redefino minha senha informando uma nova senha de pelo menos 6 caracteres
  Então minha senha é atualizada
  E o token é invalidado para uso futuro

Cenário: Recuperação para e-mail não cadastrado
  Quando solicito a recuperação de senha de um e-mail que não existe
  Então recebo uma resposta de sucesso sem revelar se o e-mail existe

Cenário: Redefinição com token expirado
  Dado que possuo um token de recuperação que já expirou
  Quando tento redefinir a senha com esse token
  Então a operação é rejeitada
  E vejo a mensagem "Token de recuperação inválido ou expirado."

Cenário: Redefinição com nova senha curta
  Dado que possuo um token de recuperação válido
  Quando tento redefinir a senha com menos de 6 caracteres
  Então a operação é rejeitada
  E vejo a mensagem "A nova senha deve possuir no mínimo 6 caracteres."

Cenário: Redefinição desbloqueia usuário bloqueado
  Dado que minha conta está bloqueada por excesso de tentativas
  Quando redefino minha senha com um token de recuperação válido
  Então minha conta é desbloqueada
  E consigo fazer login com a nova senha
```

---

## 10. Gerenciamento do próprio perfil

**Como cliente autenticado**
Quero visualizar e atualizar meus dados de cadastro (nome, CPF, telefone e endereço)
Para manter minhas informações corretas e poder realizar reservas

**Regras de negócio:**
- O usuário só pode visualizar e atualizar o próprio perfil.
- O CPF deve possuir 11 dígitos numéricos.
- O telefone deve ter pelo menos 10 dígitos.
- Endereço e nome não podem ser vazios.
- O sistema nunca expõe o hash da senha em respostas.
- Sem nome, CPF, telefone e endereço cadastrados o cliente não consegue criar reservas (a API responde com `400` indicando os campos faltantes).

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Atualização de perfil bem-sucedida
  Dado que sou um cliente autenticado
  Quando atualizo meu perfil informando nome, CPF, telefone e endereço válidos
  Então meus dados são salvos
  E ao consultar meu perfil vejo os valores atualizados

Cenário: CPF inválido na atualização de perfil
  Dado que sou um cliente autenticado
  Quando atualizo meu perfil informando um CPF que não tenha 11 dígitos
  Então a atualização é rejeitada
  E vejo a mensagem "CPF inválido. Informe 11 dígitos."

Cenário: Telefone inválido na atualização de perfil
  Dado que sou um cliente autenticado
  Quando atualizo meu perfil informando um telefone com menos de 10 dígitos
  Então a atualização é rejeitada
  E vejo a mensagem "Telefone inválido. Informe ao menos 10 dígitos."

Cenário: Endereço em branco na atualização de perfil
  Dado que sou um cliente autenticado
  Quando atualizo meu perfil informando endereço vazio
  Então a atualização é rejeitada
  E vejo a mensagem "Endereço inválido."

Cenário: Senha nunca é exposta nas respostas de perfil
  Dado que sou um cliente autenticado
  Quando consulto meu perfil
  Então a resposta não contém o hash da minha senha

Esquema do Cenário: Validação de campos do perfil
  Dado que sou um cliente autenticado
  Quando atualizo meu perfil com o campo "<campo>" no valor "<valor>"
  Então a atualização <resultado>

  Exemplos:
    | campo    | valor         | resultado                                                                    |
    | cpf      | 12345678900   | é aceita                                                                     |
    | cpf      | 123           | é rejeitada com a mensagem "CPF inválido. Informe 11 dígitos."               |
    | telefone | 11999999999   | é aceita                                                                     |
    | telefone | 1199          | é rejeitada com a mensagem "Telefone inválido. Informe ao menos 10 dígitos." |
    | nome     |               | é rejeitada com a mensagem "Nome não pode ser vazio."                        |
```

---

## 11. Detalhe de uma reserva

**Como cliente**
Quero consultar os detalhes de uma reserva específica
Para conferir status, data, refeição e eventuais informações de cancelamento/entrega

**Regras de negócio:**
- O cliente só pode consultar reservas de sua própria autoria.
- Administradores podem consultar qualquer reserva.
- Reservas inexistentes retornam `404 Not Found`.
- A resposta inclui `status`, `cancelledAt`, `cancelReason`, `deliveredAt` e demais metadados.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Cliente consulta detalhe de reserva própria
  Dado que sou um cliente autenticado com uma reserva criada
  Quando consulto o detalhe dessa reserva
  Então recebo todos os dados da reserva, incluindo o status

Cenário: Cliente tenta consultar reserva de terceiros
  Dado que sou um cliente autenticado
  E existe uma reserva pertencente a outro cliente
  Quando tento consultar o detalhe dessa reserva
  Então a consulta é rejeitada
  E vejo a mensagem "Você só pode visualizar reservas próprias."

Cenário: Consulta a reserva inexistente
  Dado que sou um usuário autenticado
  Quando consulto um identificador de reserva que não existe
  Então recebo a mensagem "Reserva não encontrada."

Cenário: Administrador consulta reserva de qualquer cliente
  Dado que sou um administrador autenticado
  E existe uma reserva pertencente a um cliente
  Quando consulto o detalhe dessa reserva
  Então recebo todos os dados da reserva
```

---

## 12. Listagem global de reservas pelo administrador

**Como administrador**
Quero consultar todas as reservas do sistema (não apenas as minhas)
Para acompanhar o operacional da cantina

**Regras de negócio:**
- Apenas administradores podem ativar a listagem global (parâmetro `all=true`).
- Os mesmos filtros por intervalo de data (`from`, `to`) estão disponíveis.
- Os resultados são retornados ordenados por data ascendente.
- Sem o parâmetro `all`, mesmo administradores recebem apenas as próprias reservas.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Administrador lista todas as reservas
  Dado que sou um administrador autenticado
  E existem reservas de diferentes clientes
  Quando consulto a listagem global de reservas
  Então recebo as reservas de todos os clientes ordenadas por data ascendente

Cenário: Administrador filtra a listagem global por intervalo de datas
  Dado que sou um administrador autenticado
  Quando consulto a listagem global filtrando por um intervalo de datas
  Então recebo apenas as reservas dentro do intervalo informado

Cenário: Cliente solicita a listagem global
  Dado que sou um cliente autenticado
  Quando solicito a listagem global de reservas
  Então recebo apenas as minhas reservas

Cenário: Administrador sem o parâmetro global
  Dado que sou um administrador autenticado
  Quando consulto a listagem de reservas sem ativar o modo global
  Então recebo apenas as reservas que eu mesmo criei
```

---

## 13. Histórico de cancelamentos (administrador)

**Como administrador**
Quero consultar o histórico completo de cancelamentos
Para auditar quem cancelou, quando e por qual motivo

**Regras de negócio:**
- Apenas administradores acessam o histórico.
- O histórico registra cancelamentos feitos por clientes e por administradores, com:
    - Identificador do cancelamento e da reserva.
    - Usuário que cancelou e seu papel (cliente/admin).
    - Motivo (obrigatório quando o admin cancela; padronizado quando o cliente cancela).
    - Data e hora do cancelamento.
- É possível filtrar pelo `reservationId` para ver o histórico de uma reserva específica.

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Administrador consulta o histórico completo
  Dado que sou um administrador autenticado
  E existem cancelamentos feitos por clientes e por administradores
  Quando consulto o histórico de cancelamentos
  Então recebo a lista com cada cancelamento contendo o autor, o papel, o motivo e a data

Cenário: Administrador filtra histórico por uma reserva específica
  Dado que sou um administrador autenticado
  Quando consulto o histórico filtrando por um identificador de reserva
  Então recebo apenas os registros vinculados àquela reserva

Cenário: Cliente tenta consultar o histórico
  Dado que sou um cliente autenticado
  Quando tento consultar o histórico de cancelamentos
  Então a consulta é rejeitada
  E vejo a mensagem "Apenas administradores podem acessar este recurso."

Cenário: Histórico contém motivo do administrador
  Dado que um administrador cancelou uma reserva informando um motivo
  Quando consulto o histórico dessa reserva
  Então o registro contém o motivo informado pelo administrador
```

---

## 14. Documentação interativa da API

**Como integrador/desenvolvedor**
Quero acessar a documentação completa da API em formato OpenAPI/Swagger
Para entender contratos, schemas e códigos de erro de cada endpoint

**Regras de negócio:**
- A especificação é versionada em arquivo (`resources/swagger.yaml`) e carregada na inicialização da API.
- O endpoint `GET /api-docs` renderiza a UI interativa do Swagger.
- O endpoint `GET /api-docs.json` retorna o documento OpenAPI bruto para uso por ferramentas externas.
- A documentação descreve, para cada endpoint, o request body, query/path params, schemas de resposta e os possíveis códigos de erro (`400`, `401`, `403`, `404`, `409`, `423`, `500`).

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Acessar a UI da documentação Swagger
  Quando acesso o endpoint de documentação interativa da API
  Então vejo a UI Swagger com todos os endpoints da Cantina API

Cenário: Obter a especificação OpenAPI bruta
  Quando solicito a especificação da API em formato OpenAPI
  Então recebo o documento OpenAPI 3.0 da Cantina

Cenário: Documentação contempla códigos de erro
  Quando consulto a documentação de qualquer endpoint
  Então vejo os códigos de erro previstos (400, 401, 403, 404, 409, 423, 500) com suas mensagens
```

---

## 15. Consultar disponibilidade de marmitas

**Como cliente autenticado**
Quero consultar quantas marmitas ainda estão disponíveis em uma data, separadas por refeição
Para escolher uma refeição que ainda tenha vaga sem precisar tentar reservar e receber erro

**Regras de negócio:**
- A consulta exige autenticação (clientes e administradores podem usá-la).
- A consulta é feita por data (parâmetro obrigatório no formato `YYYY-MM-DD`).
- Para cada refeição configurada o sistema retorna `stock` (capacidade do dia), `used` (reservas ativas já consumidas) e `available` (`stock - used`, mínimo 0).
- Reservas com status `cancelada` ou `entregue` não consomem estoque.
- O cálculo respeita as variáveis de ambiente `DEFAULT_DAILY_STOCK_ALMOCO` e `DEFAULT_DAILY_STOCK_JANTAR` (com fallback para `DEFAULT_DAILY_STOCK` e padrão 50).
- Datas inválidas retornam `400` com mensagem orientando o formato esperado.
- Datas no passado e no futuro são aceitas (a regra de "não reservar no passado" pertence à criação, não à consulta).

**Critérios de Aceitação (Gherkin):**

```gherkin
Cenário: Consulta de disponibilidade em uma data sem reservas
  Dado que sou um cliente autenticado
  E não existe nenhuma reserva ativa para a data alvo
  Quando consulto a disponibilidade dessa data
  Então recebo, para cada refeição, a capacidade total como "stock", "used" igual a 0 e "available" igual ao "stock"

Cenário: Consulta de disponibilidade após reservas serem feitas
  Dado que sou um cliente autenticado
  E já existem reservas ativas de almoço para a data alvo
  Quando consulto a disponibilidade dessa data
  Então o "used" do almoço corresponde à quantidade de reservas ativas
  E o "available" do almoço é igual a "stock - used"

Cenário: Reservas canceladas não consomem o estoque exibido
  Dado que sou um cliente autenticado
  E existe uma reserva de almoço cancelada para a data alvo
  Quando consulto a disponibilidade dessa data
  Então essa reserva cancelada não é contabilizada em "used"

Cenário: Reservas entregues não consomem o estoque exibido
  Dado que sou um cliente autenticado
  E existe uma reserva de almoço já entregue para a data alvo
  Quando consulto a disponibilidade dessa data
  Então essa reserva entregue não é contabilizada em "used"

Cenário: Estoque esgotado é refletido na disponibilidade
  Dado que sou um cliente autenticado
  E o número de reservas ativas de jantar atingiu a capacidade máxima do dia
  Quando consulto a disponibilidade dessa data
  Então o "available" do jantar é 0

Cenário: Consulta sem autenticação
  Quando solicito a disponibilidade sem enviar token
  Então a consulta é rejeitada
  E vejo a mensagem "Token não enviado. Use o header Authorization: Bearer <token>."

Cenário: Consulta com data em formato inválido
  Dado que sou um cliente autenticado
  Quando solicito a disponibilidade com um parâmetro de data fora do formato YYYY-MM-DD
  Então a consulta é rejeitada
  E vejo a mensagem "Data inválida. Use o formato YYYY-MM-DD."
```
