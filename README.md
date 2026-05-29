# Desafio Integrador 2026

Monorepo com três serviços de aplicação (web + duas APIs) orquestrados via Docker Compose, cada API com seu próprio banco PostgreSQL, além de Redis e um worker Celery.

## Visão geral da arquitetura

```
                          ┌─────────────────────┐
                          │   web (Next.js 16)  │  :3000
                          └──────────┬──────────┘
                                     │ HTTP
                   ┌─────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌────────────────────┐                ┌────────────────────┐
        │ api-django         │ :8000          │ api-nest           │ :3001
        │ Django + Ninja     │                │ NestJS + TypeORM   │
        └─────────┬──────────┘                └─────────┬──────────┘
                  │                                      │
                  ▼                                      ▼
        ┌────────────────────┐                ┌────────────────────┐
        │ postgres-django    │ :5432          │ postgres-nest      │ :5433
        └────────────────────┘                └────────────────────┘

        ┌────────────────────┐     ┌────────────────────┐
        │ redis              │     │ celery-worker      │
        │ :6379              │◄────│ (tarefas Django)   │
        └────────────────────┘     └────────────────────┘
```

## Serviços

| Serviço | Stack | Porta (host) | Descrição |
|---|---|---|---|
| `web` | Next.js 16, React 19, Tailwind 4 | `3000` | Front-end |
| `api-django` | Django 5, django-ninja, Celery, scikit-learn | `8000` | API HTTP (`/api`) + stack de ML (churn) |
| `api-nest` | NestJS 11, TypeORM | `3001` | API HTTP (`/api`) |
| `postgres-django` | PostgreSQL 16 | `5432` | Banco exclusivo do Django |
| `postgres-nest` | PostgreSQL 16 | `5433` | Banco exclusivo do Nest |
| `redis` | Redis 7 | `6379` | Broker/result backend do Celery |
| `celery-worker` | Celery (imagem do Django) | — | Processa tarefas assíncronas do Django |

## Estrutura do repositório

```
.
├── app/
│   └── web/                  # Next.js
├── packages/
│   ├── api-django/           # Django + Ninja + Celery + ML
│   │   ├── config/           # settings, urls, celery, api raiz
│   │   ├── common/           # utilitários compartilhados
│   │   └── domains/          # domínios (accounts, churn)
│   └── api-nest/             # NestJS + TypeORM
│       └── src/              # entry, módulos, controllers
└── docker-compose.yml        # orquestração de tudo
```

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine + Compose v2)
- Nenhuma outra dependência local é necessária — tudo roda em contêineres.

## Como rodar

Tudo é feito a partir da raiz do projeto.

```bash
# subir tudo (build na primeira vez)
docker compose up --build

# ou, em segundo plano:
docker compose up -d --build

# parar
docker compose down

# parar e apagar os volumes (zera os bancos)
docker compose down -v
```

Após subir, os serviços ficam disponíveis em:

- Web: <http://localhost:3000>
- API Django: <http://localhost:8000/api/>
- API Nest: <http://localhost:3001/api/>

### Verificação rápida (health checks)

```bash
curl http://localhost:8000/api/health
curl http://localhost:3001/api/health
```

A resposta do Nest inclui o nome do banco conectado (`db`), confirmando a conexão com o PostgreSQL.

## Bancos de dados

Cada API tem **uma instância PostgreSQL independente** — mesmo formato de credenciais, dados separados.

| Banco | Host interno (entre contêineres) | Host externo (sua máquina) |
|---|---|---|
| Django | `postgres-django:5432` | `localhost:5432` |
| Nest | `postgres-nest:5432` | `localhost:5433` |

Credenciais (dev): usuário `app`, senha `app`, database `app`.

String de conexão:

- Django: `postgres://app:app@postgres-django:5432/app`
- Nest: `postgres://app:app@postgres-nest:5432/app`

> **Atenção ao hostname:** dentro do Docker use o nome do serviço (`postgres-django` / `postgres-nest`); a partir da sua máquina use `localhost` com a porta publicada (`5432` / `5433`).

### Acessar um banco via psql

```bash
docker compose exec postgres-django psql -U app -d app
docker compose exec postgres-nest   psql -U app -d app
```

## Propriedade do schema

- O **Nest** é a fonte da verdade do schema das tabelas de domínio (via entidades TypeORM). Com `TYPEORM_SYNC=true`, o TypeORM cria/atualiza as tabelas a partir das classes `@Entity` no boot.
- O **Django** mantém suas próprias tabelas de framework (auth, sessions, admin) no banco dele. Para tabelas de domínio compartilhadas, os modelos usam `managed = False` + `db_table`, ou seja: o Django lê e escreve, mas **não** altera o schema dessas tabelas.

> `TYPEORM_SYNC=true` é apenas para desenvolvimento — ele pode **apagar colunas** ao sincronizar. Em produção, use migrations do TypeORM (`TYPEORM_SYNC=false`).

## Variáveis de ambiente

Em Docker, as variáveis já estão definidas no `docker-compose.yml` — **não é necessário criar `.env` para rodar via Docker**.

### Django (`packages/api-django`)

| Variável | Padrão (dev/docker) | Descrição |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.docker` | Módulo de settings |
| `DJANGO_SECRET_KEY` | `dev-insecure-change-me` | **Trocar em produção** |
| `DJANGO_DEBUG` | `True` | Modo debug |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,api-django` | Hosts permitidos |
| `DATABASE_URL` | `postgres://app:app@postgres-django:5432/app` | Banco do Django |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Origens CORS |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Broker do Celery |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/1` | Result backend |
| `MODEL_ARTIFACT_DIR` | `artifacts` | Diretório de artefatos de ML |

### Nest (`packages/api-nest`)

| Variável | Padrão (docker) | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta da API |
| `DATABASE_URL` | `postgres://app:app@postgres-nest:5432/app` | Banco do Nest |
| `TYPEORM_SYNC` | `true` | Sincroniza schema a partir das entidades (dev) |

### Rodar um serviço fora do Docker (host)

Rodar `manage.py`/`npm run start:dev` direto na máquina **não** aponta automaticamente para o Postgres do Docker:

- Django cai no padrão SQLite (veja `packages/api-django/.env.example`) — defina `DATABASE_URL` para usar o Postgres.
- Nest não tem loader de `.env` — exporte `DATABASE_URL` manualmente.

Lembre-se de usar `localhost:5432` (Django) / `localhost:5433` (Nest) ao conectar a partir do host.

## Desenvolvimento

O código-fonte é montado por bind-mount nos contêineres, com hot reload:

- **web**: `next dev`
- **api-nest**: `nest start --watch`
- **api-django**: `runserver` com `StatReloader`

Comandos úteis:

```bash
# logs de um serviço
docker compose logs -f api-django

# status de todos os serviços
docker compose ps

# rebuild de um serviço específico
docker compose build api-nest

# recriar um serviço (aplica mudança de variável de ambiente)
docker compose up -d api-nest
```

### Instalando dependências npm (web / nest)

Ao adicionar um pacote npm, faça nos **dois** lugares:

```bash
# para o VSCode/IntelliSense (lê o node_modules do host)
cd packages/api-nest && npm install <pacote>

# para o contêiner (embute no build, sobrevive a `down -v`)
docker compose build api-nest
```

> Após `npm install` dentro de um contêiner em execução, o `tsc --watch` não recompila sozinho (ele não observa `node_modules`) — rode `docker compose restart <serviço>`.

## Migrations do Django

```bash
docker compose exec api-django python manage.py makemigrations
docker compose exec api-django python manage.py migrate
```

## Observações e armadilhas conhecidas

- **`docker compose down -v` apaga o volume `node_modules`** dos serviços Node — dependências instaladas em runtime somem. Sempre rode `docker compose build` depois de adicionar pacotes npm para embuti-los na imagem.
- **Variáveis de ambiente**: alterar uma variável exige `docker compose up -d <serviço>` (recria o contêiner). Um `restart` mantém o ambiente antigo.
- **Conflito de porta / contêineres órfãos**: ao renomear serviços, contêineres antigos podem ficar como órfãos e segurar portas. Use `docker compose down --remove-orphans`.
