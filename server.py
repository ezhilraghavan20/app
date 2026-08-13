import os, sys
from pathlib import Path
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv
load_dotenv(ROOT / '.env')
import uvicorn
if __name__ == '__main__':
    uvicorn.run('web.app:create_app', host=os.environ.get('HOST','127.0.0.1'),
                port=int(os.environ.get('PORT',8000)),
                reload=os.environ.get('ENV','dev')!='production', factory=True)
