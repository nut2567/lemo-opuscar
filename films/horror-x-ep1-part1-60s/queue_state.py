from pathlib import Path
import json,msvcrt,copy
from contextlib import contextmanager
ROOT=Path(__file__).resolve().parent
@contextmanager
def locked():
    with (ROOT/'queue.lock').open('a+b') as f:
        if f.tell()==0:f.write(b'0');f.flush()
        f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_LOCK,1)
        try:yield
        finally:f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_UNLCK,1)
def task_update(tid,changes,reserve=False):
    with locked():
        file=ROOT/'TASK-QUEUE.json';tasks=json.loads(file.read_text(encoding='utf-8'))
        t=next(x for x in tasks if x['id']==tid)
        if reserve and t['status']!='queued':raise RuntimeError(f'{tid} already{t["status"]}')
        t.update(changes)
        file.write_text(json.dumps(tasks,ensure_ascii=False,indent=2),encoding='utf-8')
        return copy.deepcopy(t)
