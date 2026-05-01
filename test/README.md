# Suíte de testes da Cantina API

Testes automatizados de API REST com Mocha + Chai + Supertest + Mochawesome.

## Como rodar

1. Garanta que a API está rodando:
   ```
   npm start          # http://localhost:3000
   ```

2. Configure as variáveis do ambiente alvo (dev por padrão):
   ```
   cp test/env/.env.example test/env/.env.dev   # ajuste se necessário
   ```

3. Rode a suíte:
   ```
   npm test                 # contra dev
   npm run test:dev         # mesma coisa, explícita
   npm run test:hml         # contra homologação
   npm run test:prod        # contra prod (pula testes @destructive)
   npm run test:report      # gera HTML em test/reports/index.html
   npm run test:us -- US02  # roda só uma user story
   ```

## Estrutura

```
test/
├── api/                # Specs por User Story (TCs do "7 - Casos de Teste.txt")
│   ├── us01-login/
│   ├── us02-cadastro-reservas/
│   └── ...
├── env/                # Variáveis por ambiente (.env.dev/.env.hml/.env.prod)
├── fixtures/           # Dados para Data Driven Testing
├── helpers/
│   ├── env.js          # Carrega test/env/.env.<TEST_ENV>
│   ├── http.js         # Wrapper supertest
│   ├── auth.js         # login/registro/perfil
│   ├── reservations.js # Operações de reserva
│   └── dates.js        # Datas únicas/futuras
└── .mocharc.cjs
```

## Como ler os nomes dos testes

Cada `it` segue o padrão:

```
TCxx — <título do caso> (CTzz, CTww)
```

- `TCxx` — ID do caso de teste no arquivo `Prompts/Planejamento e criação do software/7 - Casos de Teste.txt`.
- `CTzz` — IDs das Condições de Teste cobertas (do arquivo `4 - Condições de Teste.txt`).

## Tag `@destructive`

Testes que alteram estado de forma irreversível (ex.: bloquear conta após 5 tentativas inválidas) são marcados com `@destructive` no nome. Em prod, esses testes são pulados (`npm run test:prod`).

## Multi-ambiente

A variável `TEST_ENV` (default `dev`) seleciona qual `.env.<env>` é carregado. As variáveis padrão por arquivo:

| Variável            | Descrição                                     |
|---------------------|-----------------------------------------------|
| `BASE_URL`          | URL onde a API está rodando                   |
| `ENV_NAME`          | Identificação humana do ambiente              |
| `ADMIN_EMAIL/PASS`  | Credenciais do admin do seed                  |
| `CLIENT_EMAIL/PASS` | Credenciais do cliente do seed                |
| `ALLOW_DESTRUCTIVE` | Se `false`, testes `@destructive` são pulados |

## Cobertura

A suíte cobre os casos de teste com Camada `Ambas` ou `API` do arquivo `7 - Casos de Teste.txt`. Casos `Web` ficam para a suíte E2E do Playwright (prompt 10).

### Configuração da API recomendada para os testes

Para a suíte rodar verde no maior número de casos, a API deve ser iniciada com o seguinte `.env` (raiz do projeto):

```
DEFAULT_DAILY_STOCK_ALMOCO=5
DEFAULT_DAILY_STOCK_JANTAR=5
RECOVERY_TOKEN_TTL_MS=500
```

- `DEFAULT_DAILY_STOCK_*=5` faz com que 1 cliente com `quantity=5` consiga esgotar uma refeição (necessário para US15/TC05).
- `RECOVERY_TOKEN_TTL_MS=500` faz o token de recuperação expirar em 500 ms, permitindo testar a expiração (US09/TC04).

Em produção, mantenha os defaults (estoque 50, TTL 30 min). Esses valores reduzidos são **somente** para a suíte de testes.

### Casos com auto-skip

Alguns testes verificam o ambiente antes de rodar e se auto-pulam quando a configuração não permite o cenário:

- **US02/TC07** — Reserva após corte da refeição: depende de `CUTOFF_HOUR_*` e da hora atual. Auto-skip se a janela ainda está aberta.
- **US15/TC05** — Refeição esgotada: auto-skip se o estoque configurado for maior que o limite por usuário (5).
- **US09/TC04** — Reset com token expirado: auto-skip se o TTL for alto demais (≥ 1.5s).

### Casos não automatizados

- **US03/TC03** — Cancelamento após corte: requer reservar para "hoje" (dependente de cortes baixos) e depois reativar a regra. Não automatizado — fica para suíte E2E ou backdoor de teste no backend.
