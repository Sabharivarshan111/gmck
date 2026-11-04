"""Exercise the real fixture helper against isolated legacy and SQLite storage."""
import ast
import datetime
import hashlib
import json
import pathlib
import sqlite3
import tempfile
import types

source = pathlib.Path(__file__).with_name('run-verification.py').read_text()
function = next(node for node in ast.parse(source).body if isinstance(node, ast.FunctionDef) and node.name == 'local_records')
code = compile(ast.Module(body=[function], type_ignores=[]), 'storage-fixture', 'exec')
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    profile = {'display_name': 'Fixture', 'year': 'second', 'university': 'tnmgr'}
    manifest = root / 'manifest.json'
    manifest.write_text(json.dumps({'orbit-profile-v1': json.dumps(profile), 'unrelated-sentinel': 'preserve'}))
    environment = {
        'pathlib': pathlib, 'datetime': datetime, 'hashlib': hashlib, 'json': json,
        'sqlite3': sqlite3, 'udid': 'isolated', 'APP_ID': 'fixture',
        'subprocess': types.SimpleNamespace(check_output=lambda *args, **kwargs: str(root)),
    }
    exec(code, environment)
    records = environment['local_records'](True)
    assert records['orbit:streak-v1']['current'] == 29
    assert records['orbit-profile-v1'] == profile
    assert json.loads(manifest.read_text())['unrelated-sentinel'] == 'preserve'
    assert environment['local_records']()['orbit:streak-v1']['current'] == 29
    manifest.unlink()
    database = sqlite3.connect(root / 'storage.db')
    database.execute('CREATE TABLE storage(key TEXT PRIMARY KEY, value TEXT)')
    database.execute('INSERT INTO storage VALUES(?,?)', ('orbit:streak-v1', json.dumps({'current': 1, 'best': 1})))
    database.commit()
    database.close()
    environment['local_records'](True)
    assert environment['local_records']()['orbit:streak-v1']['current'] == 29
print('PASS legacy manifest and SQLite fixture persistence; unrelated values preserved; no live data touched.')
