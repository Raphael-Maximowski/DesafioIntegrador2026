from marshmallow import Schema, fields

class MetricsChurnSchema(Schema):
    accuracy = fields.Float(required=True)
    precision = fields.Float(required=True)
    recall = fields.Float(required=True)
    f1_score = fields.Float(required=True)
    roc_auc = fields.Float(required=True)

class MetricsScoringSchema(Schema):
    mae = fields.Float(required=True)
    mse = fields.Float(required=True)
    r2 = fields.Float(required=True)

class TrainModelSchema(Schema):
    status = fields.Str(required=True)
    message = fields.Str(required=True)
    metrics = fields.Nested({
        "churn_model_metrics": fields.Nested(MetricsChurnSchema),
        "scoring_model_metrics": fields.Nested(MetricsScoringSchema),
        "dataset_size": fields.Int(required=True)
    }, required=True),