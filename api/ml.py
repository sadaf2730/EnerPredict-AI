import os
import sys

# Ensure both project root and ml-service directory are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
ml_service_dir = os.path.join(root_dir, "ml-service")

for p in [root_dir, ml_service_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app import app
except ImportError:
    from ml_service.app import app
