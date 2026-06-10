from marshmallow import Schema, fields

class CustomerMetricsSchema(Schema):
    total_orders = fields.Int(required=True)
    total_spent = fields.Float(required=True)
    avg_ticket = fields.Float(required=True)
    frequency = fields.Float(required=True)

class CustomerAnalyticsSchema(Schema):
    churn_probability = fields.Float(required=True)
    score = fields.Float(required=True)

class CustomerAnalyticsSchema(Schema):
    customer_id = fields.UUID(required=True)
    customer_name = fields.Str(required=True)
    customer_email = fields.Email(required=True)
    metrics = fields.Nested(CustomerMetricsSchema, required=True)
    analytics = fields.Nested(CustomerAnalyticsSchema, required=True)

class PaginatedCustomerAnalyticsSchema(Schema):
    data = fields.List(fields.Nested(CustomerAnalyticsSchema), required=True)
    total = fields.Int(required=True)
    page = fields.Int(required=True)
    per_page = fields.Int(required=True)