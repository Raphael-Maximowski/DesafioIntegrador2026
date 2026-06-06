from marshmallow import Schema, fields

class HealthCheckSchema(Schema):
    status = fields.Str(required=True)
    message = fields.Str(required=True)