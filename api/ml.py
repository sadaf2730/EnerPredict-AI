import os
import sys

# Ensure ml-service directory is in sys.path so modules and pickled artifacts are reachable
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(current_dir, "..", "ml-service"))
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

from app import app
