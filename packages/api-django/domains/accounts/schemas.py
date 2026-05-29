from ninja import Schema


class UserOut(Schema):
    id: int
    email: str
