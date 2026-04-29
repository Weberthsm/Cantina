# Cantina
Usuários podem reservar marmitas/refeições antecipadamente, com controle de disponibilidade.


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

---

## 2. Cadastro de reservas

**Como cliente**  
Quero reservar marmitas para uma data específica  
Para garantir minha refeição antecipadamente  

**Regras de negócio:**
- O cliente só pode reservar até o limite máximo de marmitas por dia (ex: 5 por pessoa).
- As reservas devem respeitar o horário de corte (ex: até 10h do dia).
- O sistema deve validar a disponibilidade de estoque antes de confirmar a reserva.(Padrão 50)
- Não permitir reservas para datas passadas.
- Um usuário só pode ter 1 reserva por refeição(almoço, jantar) no dia
- Deve confirmar reserva com sucesso quando válida
- Deve garantir coleta de nome, cpf, endereço e telefone do cliente
---
Futuro:
- Cada reserva deve estar vinculada a um usuário autenticado.

## 3. Cancelamento de reservas

**Como cliente**  
Quero cancelar uma reserva  
Para evitar cobranças ou desperdícios quando não precisar mais da refeição  

**Regras de negócio:**
- O cancelamento só pode ser realizado antes do horário de corte.
- O sistema deve atualizar automaticamente o estoque após o cancelamento.
- O cliente só pode cancelar reservas próprias.
- O sistema deve registrar o histórico de cancelamentos.

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
