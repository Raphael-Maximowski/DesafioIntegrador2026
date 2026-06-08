# Modelo de dados (api-nest)

O `api-nest` é o **dono do schema** do banco compartilhado (`postgres-nest`). Com `TYPEORM_SYNC=true`, as entidades TypeORM em [`src/domains/**/entities`](../src/domains) são a fonte da verdade — os diagramas abaixo são gerados a partir delas.

## Diagrama ER (entidade-relacionamento)

```mermaid
erDiagram
    users {
        uuid id PK
        varchar firstName
        varchar lastName
        varchar email UK "unique"
        timestamp createdAt
        timestamp updatedAt
    }
    customers {
        uuid id PK
        varchar name
        varchar email UK "unique"
        varchar city
        varchar state "varchar(2) - UF (AC..TO)"
        varchar country "default 'Brasil'"
        timestamp createdAt
        timestamp updatedAt
    }
    categories {
        uuid id PK
        varchar name
        varchar description
        timestamp createdAt
        timestamp updatedAt
    }
    products {
        uuid id PK
        varchar name
        numeric price "numeric(12,2)"
        int stock
        uuid categoryId FK "nullable -> categories.id"
        timestamp createdAt
        timestamp updatedAt
    }
    orders {
        uuid id PK
        uuid customerId FK "-> customers.id"
        varchar status "varchar(20) enum: PENDING|PAID|SHIPPED|CANCELLED, default PENDING"
        numeric totalPrice "numeric(12,2), default 0"
        timestamp createdAt
        timestamp updatedAt
    }
    order_items {
        uuid id PK
        uuid orderId FK "-> orders.id"
        uuid productId FK "-> products.id"
        int quantity
        numeric unitPrice "numeric(12,2)"
        timestamp createdAt
        timestamp updatedAt
    }

    customers  ||--o{ orders      : ""
    categories |o--o{ products    : ""
    orders     ||--o{ order_items : ""
    products   ||--o{ order_items : ""
```

## Diagrama UML (diagrama de classes)

Mesma estrutura na notação **UML**: cada tabela é uma classe, atributos no formato `+tipo nome`, com estereótipos `«PK»` / `«FK»` / `«UK»`. As relações usam **multiplicidade** UML e tipo de associação — `orders` → `order_items` é uma **composição** (losango preenchido): um item não existe sem o pedido (delete em cascata).

```mermaid
classDiagram
    class users {
        +uuid id «PK»
        +varchar firstName
        +varchar lastName
        +varchar email «UK»
        +timestamp createdAt
        +timestamp updatedAt
    }
    class customers {
        +uuid id «PK»
        +varchar name
        +varchar email «UK»
        +varchar city
        +varchar state
        +varchar country
        +timestamp createdAt
        +timestamp updatedAt
    }
    class categories {
        +uuid id «PK»
        +varchar name
        +varchar description
        +timestamp createdAt
        +timestamp updatedAt
    }
    class products {
        +uuid id «PK»
        +varchar name
        +numeric price
        +int stock
        +uuid categoryId «FK»
        +timestamp createdAt
        +timestamp updatedAt
    }
    class orders {
        +uuid id «PK»
        +uuid customerId «FK»
        +varchar status
        +numeric totalPrice
        +timestamp createdAt
        +timestamp updatedAt
    }
    class order_items {
        +uuid id «PK»
        +uuid orderId «FK»
        +uuid productId «FK»
        +int quantity
        +numeric unitPrice
        +timestamp createdAt
        +timestamp updatedAt
    }

    customers "1" --> "0..*" orders
    categories "0..1" --> "0..*" products
    orders "1" *-- "0..*" order_items
    products "1" --> "0..*" order_items
```
