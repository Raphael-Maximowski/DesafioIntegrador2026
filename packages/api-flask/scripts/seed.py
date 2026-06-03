from faker import Faker
from app import create_app
from app.extensions import db
from app.models.customer import Customer
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order
from app.models.order_items import OrderItem

fake = Faker("pt_BR")

app = create_app()

with app.app_context():

    print("Criando categorias...")

    categories = []

    for _ in range(20):
        category = Category(
            name=fake.unique.word(),
            description=fake.text(max_nb_chars=100)
        )

        categories.append(category)

    db.session.add_all(categories)
    db.session.commit()

    print(f"{len(categories)} categorias criadas")

    print("Criando produtos...")

    products = []

    for _ in range(100):
        product = Product(
            name=fake.unique.word(),
            price=round(fake.random_int(100, 10000) / 100, 2),
            stock=fake.random_int(1, 500),
            category_id=fake.random_element(categories).id
        )

        products.append(product)

    db.session.add_all(products)
    db.session.commit()

    print(f"{len(products)} produtos criados")

    print("Criando clientes...")

    customers = []

    for _ in range(1000):
        customer = Customer(
            name=fake.name(),
            email=fake.unique.email(),
            city=fake.city(),
            state=fake.state(),
            country="Brasil"
        )

        customers.append(customer)

    db.session.add_all(customers)
    db.session.commit()

    print(f"{len(customers)} clientes criados")

    print("Criando pedidos e itens...")

    total_orders = 0
    total_items = 0

    for customer in customers:

        for _ in range(fake.random_int(1, 10)):

            order = Order(
                customer_id=customer.id,
                total_amount=0
            )

            db.session.add(order)
            db.session.flush()

            total_amount = 0

            for _ in range(fake.random_int(1, 5)):

                product = fake.random_element(products)

                quantity = fake.random_int(1, 5)

                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price
                )

                db.session.add(item)

                total_amount += quantity * float(product.price)

                total_items += 1

            order.total_amount = round(total_amount, 2)

            total_orders += 1

    db.session.commit()

    print(f"{total_orders} pedidos criados")
    print(f"{total_items} itens de pedido criados")

    print("Seed finalizado com sucesso!")