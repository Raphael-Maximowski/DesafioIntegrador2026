"""Settings for the Docker Compose stack.

Like dev (DEBUG on, no SSL redirect) but with a real Celery broker so the
celery-worker container does actual work instead of running tasks eagerly.
"""
from .base import *

DEBUG = True

CELERY_TASK_ALWAYS_EAGER = False
