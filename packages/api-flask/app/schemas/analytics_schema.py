from marshmallow import Schema, fields

class CustomerMetricsSchema(Schema):
    total_orders = fields.Int(required=True)
    total_spent = fields.Float(required=True)
    avg_ticket = fields.Float(required=True)
    frequency = fields.Float(required=True)

class CustomerAnalyticsSchema(Schema):
    customer_id = fields.UUID(required=True)
    metrics = fields.Nested(CustomerMetricsSchema, required=True)
    churn_probability = fields.Float(required=True)
    churn_score = fields.Str(required=True)
    risk_level = fields.Str(required=True)
    purchase_probability = fields.Float(required=True)
    purchase_score = fields.Str(required=True)

class PaginatedCustomerAnalyticsSchema(Schema):
    items = fields.List(fields.Nested(CustomerAnalyticsSchema), required=True)
    total = fields.Int(required=True)
    page = fields.Int(required=True)
    per_page = fields.Int(required=True)