# Desafio Integrador 2026

Monorepo de **análise de vendas com previsão de churn e propensão de compra**. Reúne um front-end web e duas APIs — uma de domínio (CRUD + autenticação) e uma de machine learning — orquestradas via Docker Compose, com um PostgreSQL compartilhado, Redis e um capturador de e-mails para desenvolvimento.

## Visão geral da aplicação

### web — front-end (Next.js 16, App Router)

Painel de gestão de vendas. Usa _route groups_: `(auth)` para login e cadastro, `(app)` para as telas autenticadas — **dashboard**, **clientes**, **produtos** e **pedidos** (cada uma com listagem, criação e detalhe). Estado de sessão com **zustand** (store persistido); chamadas HTTP via **axios**, que injeta o JWT e faz _refresh_ automático ao receber `401`. UI com **react-hook-form + zod**, gráficos com **recharts**.

### api-nest — auth + CRUD (NestJS 11 + TypeORM)

Backend de domínio servido sob o prefixo `/api`. Responsável por:

- **Autenticação passwordless**: cadastro, solicitação de OTP, verificação de OTP, _refresh_ e logout. O código OTP é enviado por e-mail (capturado pelo Mailpit) e guardado no Redis; o login emite um **JWT de acesso + refresh token**. Todas as rotas são protegidas por um `JwtAuthGuard` global, com _rate limiting_ (`ThrottlerGuard`, 60 req/min).
- **CRUD de domínio**: clientes, produtos, categorias, pedidos (com itens de pedido) e endpoints de **dashboard** (visão geral, produtos, clientes).
- **Dono do schema**: as entidades TypeORM (User, Customer, Product, Category, Order, OrderItem) definem as tabelas. Com `TYPEORM_SYNC=true`, o Nest cria/atualiza as tabelas no boot.

📖 Referência de endpoints (Swagger): **http://localhost:3001/api/docs**

### api-flask — ML / analytics (Flask 3 + scikit-learn)

Serviço de machine learning. **Lê o mesmo banco** do Nest (os models SQLAlchemy mapeiam as tabelas existentes) e expõe métricas e probabilidades por cliente.

📖 Referência de endpoints (Swagger): **http://localhost:8001/docs**

#### Stack de ML (churn & propensão de compra)

A partir do histórico de pedidos, o serviço deriva as _features_ por cliente:

`total_orders`, `total_spent`, `avg_ticket`, `days_since_last_order`, `frequency`

E treina **dois modelos RandomForest**, persistidos em disco como `.pkl`:

| Modelo | Arquivo | Regra do rótulo | Pergunta que responde |
|---|---|---|---|
| Churn | `churn_model.pkl` | `days_since_last_order > 90` | Qual a chance do cliente abandonar? |
| Propensão de compra | `purchase_model.pkl` | `days_since_last_order <= 30` | Qual a chance de uma nova compra? |

O endpoint de métricas por cliente retorna as probabilidades, os _scores_ (0–100) e o **nível de risco** (`Baixo` < 0.3, `Médio` < 0.7, `Alto`). Para re-treinar os modelos a partir dos dados atuais, chame `POST /train/model`.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine + Compose v2)
- Nenhuma outra dependência local é necessária — tudo roda em contêineres.

## Como rodar

Tudo é feito a partir da raiz do projeto.

```bash
# subir tudo (build na primeira vez)
docker compose up --build
```

Após subir, os serviços ficam disponíveis em:

- Web: <http://localhost:3000>
- API Nest (Swagger): <http://localhost:3001/api/docs>
- API Flask (Swagger): <http://localhost:8001/docs>
- Mailpit (e-mails de OTP): <http://localhost:8025>

## Bancos de dados

As duas APIs compartilham **uma única instância PostgreSQL** (`postgres-nest`).

| | Host interno (entre contêineres) | Host externo (sua máquina) |
|---|---|---|
| postgres-nest | `postgres-nest:5432` | `localhost:5433` |

Credenciais (dev): usuário `app`, senha `app`, database `app`.

String de conexão:

- Nest: `postgres://app:app@postgres-nest:5432/app`
- Flask: `postgresql://app:app@postgres-nest:5432/app`

> **Atenção ao hostname:** dentro do Docker use o nome do serviço (`postgres-nest`); a partir da sua máquina use `localhost` com a porta publicada (`5433`).

### Popular o banco (seed)

```bash
docker compose exec api-nest npm run seed

docker compose exec api-flask python scripts/seed.py
```

### Re-treinar os modelos de ML

```bash
curl -X POST http://localhost:8001/train/model
```

### Migrations do Flask

```bash
docker compose exec api-flask flask db migrate -m "mensagem"
docker compose exec api-flask flask db upgrade
```
