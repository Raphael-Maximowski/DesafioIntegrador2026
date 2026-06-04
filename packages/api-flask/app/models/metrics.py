from app.extensions import db
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Metric (db.Model):
    __tablename__ = "metrics"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'), nullable=False)
    metric_name = db.Column(db.String(255), nullable=False)
    metric_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())