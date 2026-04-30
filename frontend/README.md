# Cantina • Frontend (Vue 3 + Tailwind)

Aplicação Web para o sistema de reserva de marmitas. Conversa com a [Cantina API](../README.md) (Express + JWT) descrita em `resources/swagger.yaml`.

## Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vite** — bundler e dev server
- **Vue Router** — navegação SPA com guards de autenticação
- **Pinia** — gerenciamento de estado (auth e notificações)
- **Axios** — cliente HTTP com interceptors
- **Tailwind CSS** — estilização utilitária

## Estrutura

```
frontend/
├── index.html
├── package.json
├── vite.config.js          # Proxy /api -> http://localhost:3000
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.js
    ├── App.vue
    ├── assets/main.css     # Diretivas Tailwind + classes utilitárias
    ├── router/             # Vue Router + guards (auth/admin)
    ├── services/           # http (axios), auth/user/reservation services
    ├── stores/             # Pinia: auth + notifications (toasts)
    ├── components/         # AppLayout, Navbar, Toast, ReservationCard, ConfirmDialog…
    └── views/              # Login, Register, ConfirmEmail, Forgot/Reset, Dashboard, Reservas, Perfil, Admin
```

A divisão **services → stores → views/components** mantém a aplicação escalável: novas telas reutilizam os mesmos clientes HTTP e stores; novas APIs são adicionadas como mais um service.

## Como rodar

```bash
# 1. Suba a API em outra aba
cd ..
npm install
npm start                   # API em http://localhost:3000

# 2. Em outro terminal, rode o frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Para gerar build de produção:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Copie `.env.example` para `.env` se for apontar para uma API hospedada:

```
VITE_API_BASE_URL=https://sua-api.com
```

Sem essa variável, em dev o Vite faz proxy de `/api/*` para `http://localhost:3000`.

## Tratamento de erros

Todo erro HTTP fora da faixa 2xx é capturado pelo interceptor de Axios em `src/services/http.js` e:

1. Vira um **toast** no canto superior direito (verde/azul/amarelo/vermelho conforme o status).
2. Em **401 com sessão ativa**, força logout e redireciona para `/login`.
3. Em **erros de rede/timeout**, exibe "Falha de conexão".
4. A mensagem do campo `message` da API (ex. "Limite de 5 reservas por dia atingido.") é usada literalmente — assim o front sempre exibe a regra de negócio do back.

## UX

- Layout responsivo (mobile-first), navegação com indicação visual de página ativa.
- Botões com estado de carregamento (`Aguarde…`).
- Confirmações em diálogo modal antes de ações destrutivas (cancelar reserva, cancelar como admin com motivo, marcar como entregue).
- Empty states amigáveis com call-to-action.
- Feedback imediato via toasts (sucesso, aviso, erro).
- Acessibilidade: foco visível, `aria-label` em ícones, formulários com `label`/`required`.
- **Quantidade por reserva**: a tela de Nova Reserva tem um stepper (`−` / `+`) para escolher quantas marmitas reservar. O máximo é dinâmico: `min(estoque restante da refeição, marmitas que o usuário ainda pode reservar no dia)`. Acima do botão aparece um resumo do orçamento diário do usuário ("já reservadas hoje: 2 · ainda pode reservar: 3").
- **Disponibilidade em tempo real na tela de Nova Reserva**: ao mudar a data, o front consulta `GET /reservations/availability?date=...` e mostra badges em cada refeição:
    - 🟢 Verde — `N disponíveis` (folga confortável).
    - 🟡 Âmbar — `Quase esgotado · N restantes` (≤10% do estoque ou ≤3 unidades).
    - 🔴 Vermelho — `Esgotado` (refeição é desabilitada e o botão troca para "Esgotado").
  Em caso de erro ao criar (ex.: outro cliente esgotou o estoque entre a consulta e o submit), o front recarrega a disponibilidade automaticamente.

## Contas de teste (criadas pelo seed da API)

| Perfil  | E-mail              | Senha       |
|---------|---------------------|-------------|
| admin   | admin@cantina.com   | Admin@123   |
| cliente | cliente@cantina.com | Cliente@123 |
