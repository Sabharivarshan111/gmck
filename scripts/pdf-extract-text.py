#!/usr/bin/env python3
"""Minimal PDF text extractor (stdlib only).

Enough for text-based PDFs: walks every object, inflates FlateDecode streams,
runs the content-stream text operators, and maps glyph codes back through the
font's ToUnicode CMap when there is one. No external deps, because this
sandbox cannot reach PyPI.
"""
import re, sys, zlib

def objects(buf):
    """id -> (dict_bytes, stream_bytes|None) for every 'N G obj' in the file."""
    out = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b', buf):
        oid = int(m.group(1))
        start = m.end()
        end = buf.find(b'endobj', start)
        if end < 0:
            continue
        body = buf[start:end]
        sm = re.search(rb'stream\r?\n', body)
        stream = None
        head = body
        if sm:
            head = body[:sm.start()]
            raw = body[sm.end():]
            e = raw.rfind(b'endstream')
            if e >= 0:
                raw = raw[:e]
            stream = raw
        out[oid] = (head, stream)
    return out

def inflate(head, data):
    if data is None:
        return None
    if b'FlateDecode' in head:
        for trim in (0, 1, 2):
            try:
                return zlib.decompress(data[trim:] if trim else data)
            except zlib.error:
                pass
        try:
            return zlib.decompressobj().decompress(data)
        except zlib.error:
            return None
    return data

def tounicode_map(cmap_bytes):
    """Parse a ToUnicode CMap into {code:int -> str}."""
    m = {}
    if not cmap_bytes:
        return m
    txt = cmap_bytes
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', txt, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            try:
                m[int(src, 16)] = bytes.fromhex(dst.decode()).decode('utf-16-be', 'ignore')
            except Exception:
                pass
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', txt, re.S):
        for lo, hi, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            lo_i, hi_i = int(lo, 16), int(hi, 16)
            base = int(dst, 16)
            for i in range(min(hi_i - lo_i + 1, 65536)):
                try:
                    m[lo_i + i] = chr(base + i) if base + i < 0x110000 else ''
                except Exception:
                    pass
    return m

def unescape(s):
    out, i = bytearray(), 0
    esc = {ord('n'): 10, ord('r'): 13, ord('t'): 9, ord('b'): 8, ord('f'): 12,
           ord('('): 40, ord(')'): 41, ord('\\'): 92}
    while i < len(s):
        c = s[i]
        if c == 92 and i + 1 < len(s):
            n = s[i + 1]
            if n in esc:
                out.append(esc[n]); i += 2; continue
            if 48 <= n <= 55:
                oct_digits = s[i+1:i+4]
                k = 0
                while k < len(oct_digits) and 48 <= oct_digits[k] <= 55:
                    k += 1
                out.append(int(oct_digits[:k], 8) & 0xFF); i += 1 + k; continue
            if n in (10, 13):
                i += 2; continue
            out.append(n); i += 2; continue
        out.append(c); i += 1
    return bytes(out)

def strings_in(content):
    """Yield ('str', bytes) and ('op', name) in order, plus font switches."""
    i, n = 0, len(content)
    while i < n:
        c = content[i]
        if c == 40:  # (
            depth, j, esc = 1, i + 1, False
            while j < n and depth:
                ch = content[j]
                if esc: esc = False
                elif ch == 92: esc = True
                elif ch == 40: depth += 1
                elif ch == 41: depth -= 1
                j += 1
            yield ('lit', content[i+1:j-1]); i = j; continue
        if c == 60 and i + 1 < n and content[i+1] != 60:  # <hex>
            j = content.find(b'>', i)
            if j < 0: break
            yield ('hex', content[i+1:j]); i = j + 1; continue
        m = re.match(rb'/([^\s/\[\]<>(){}]+)\s+[\d.]+\s+Tf', content[i:])
        if m:
            yield ('font', m.group(1)); i += m.end(); continue
        m = re.match(rb"(TJ|Tj|T\*|Td|TD|ET|'|\")", content[i:])
        if m:
            yield ('op', m.group(1)); i += m.end(); continue
        m = re.match(rb'(-?\d+(?:\.\d+)?)', content[i:])
        if m:
            yield ('num', m.group(1)); i += m.end(); continue
        i += 1

def page_text(content, fontmaps, fontres):
    parts, cur, nums = [], None, []
    for kind, val in strings_in(content):
        if kind == 'font':
            cur = fontmaps.get(fontres.get(val))
        elif kind in ('lit', 'hex'):
            nums = []
            if kind == 'hex':
                h = re.sub(rb'[^0-9A-Fa-f]', b'', val).decode()
                if len(h) % 2:
                    h += '0'
                raw = bytes.fromhex(h)
            else:
                raw = unescape(val)
            if cur:
                # 2-byte codes when the cmap looks wide
                wide = any(k > 255 for k in cur) or len(raw) % 2 == 0 and all(
                    int.from_bytes(raw[i:i+2], 'big') in cur for i in range(0, len(raw), 2)) and raw
                if wide:
                    parts.append(''.join(cur.get(int.from_bytes(raw[i:i+2], 'big'), '')
                                         for i in range(0, len(raw) - 1, 2)))
                else:
                    parts.append(''.join(cur.get(b, chr(b) if 32 <= b < 127 else '') for b in raw))
            else:
                parts.append(raw.decode('latin-1', 'ignore'))
        elif kind == 'num':
            try:
                f = float(val)
            except ValueError:
                continue
            nums.append(f)
            # Inside a TJ array a large negative kern is a word space.
            if f <= -80:
                parts.append(' ')
        elif kind == 'op':
            if val in (b'T*', b"'", b'"'):
                parts.append('\n')
            elif val in (b'Td', b'TD'):
                # Only a vertical move is a new line; a pure horizontal move is
                # the same line continuing, which is how Google Docs lays out
                # every run of a paragraph.
                ty = nums[-1] if nums else 0.0
                parts.append('\n' if abs(ty) > 0.01 else ' ')
            elif val == b'ET':
                parts.append('\n')
            nums = []
    txt = ''.join(parts)
    txt = re.sub(r'[ \t]{2,}', ' ', txt)
    txt = re.sub(r' *\n *', '\n', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    # Small-caps headings emit their first glyph from a second font, which puts
    # it on a line of its own ("C\nASE 1"). Re-join those.
    txt = re.sub(r'\n([A-Za-z])\n(?=[A-Za-z])', r'\n\1', txt)
    return txt

def expand_objstm(objs):
    """Modern PDFs pack most objects into /ObjStm streams; unpack them in."""
    extra = {}
    for oid, (head, stream) in list(objs.items()):
        if not re.search(rb'/Type\s*/ObjStm', head):
            continue
        data = inflate(head, stream)
        if not data:
            continue
        nm = re.search(rb'/N\s+(\d+)', head)
        fm = re.search(rb'/First\s+(\d+)', head)
        if not nm or not fm:
            continue
        n, first = int(nm.group(1)), int(fm.group(1))
        nums = re.findall(rb'(\d+)\s+(\d+)', data[:first])[:n]
        for idx, (num, off) in enumerate(nums):
            start = first + int(off)
            end = first + int(nums[idx + 1][1]) if idx + 1 < len(nums) else len(data)
            extra[int(num)] = (data[start:end], None)
    for k, v in extra.items():
        objs.setdefault(k, v)
    return objs


def extract(path):
    buf = open(path, 'rb').read()
    objs = expand_objstm(objects(buf))

    # ToUnicode maps, keyed by the font object id
    fontmaps = {}
    for oid, (head, stream) in objs.items():
        m = re.search(rb'/ToUnicode\s+(\d+)\s+\d+\s+R', head)
        if m:
            tid = int(m.group(1))
            if tid in objs:
                data = inflate(*objs[tid])
                fontmaps[oid] = tounicode_map(data)

    pages = []
    for oid, (head, stream) in objs.items():
        if b'/Type' not in head or not re.search(rb'/Type\s*/Page\b', head):
            continue
        # font resource names on this page -> font object id
        fontres = {}
        fm = re.search(rb'/Font\s*(?:(\d+)\s+\d+\s+R|<<(.*?)>>)', head, re.S)
        blob = None
        if fm and fm.group(1):
            fid = int(fm.group(1))
            if fid in objs:
                blob = objs[fid][0]
        elif fm:
            blob = fm.group(2)
        if blob:
            for nm, ref in re.findall(rb'/([^\s/]+)\s+(\d+)\s+\d+\s+R', blob):
                fontres[nm] = int(ref)
        cm = re.search(rb'/Contents\s+(?:(\d+)\s+\d+\s+R|\[(.*?)\])', head, re.S)
        chunks = []
        if cm and cm.group(1):
            chunks = [int(cm.group(1))]
        elif cm:
            chunks = [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', cm.group(2))]
        # /Contents may point at an object that is itself an array of stream
        # refs, so resolve one level of indirection before inflating.
        resolved = []
        for cid in chunks:
            if cid not in objs:
                continue
            chead, cstream = objs[cid]
            if cstream is None and b'[' in chead:
                resolved += [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', chead)]
            else:
                resolved.append(cid)
        content = b''
        for cid in resolved:
            if cid in objs:
                d = inflate(*objs[cid])
                if d:
                    content += d + b'\n'
        if content:
            pages.append((oid, page_text(content, fontmaps, fontres)))
    pages.sort(key=lambda p: p[0])
    return [p[1] for p in pages]

if __name__ == '__main__':
    out = extract(sys.argv[1])
    for i, t in enumerate(out, 1):
        print(f'\n===== PAGE {i} =====')
        print(t.strip())
