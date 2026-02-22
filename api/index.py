import sys
from pathlib import Path

# Add the backend directory to Python path so Vercel can find the modules
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from app.main import app
