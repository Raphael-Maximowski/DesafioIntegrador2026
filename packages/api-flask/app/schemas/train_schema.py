from marshmallow import Schema, fields

class TrainModelSchema(Schema):
    status = fields.Str(required=True)    
    message = fields.Str(required=True)