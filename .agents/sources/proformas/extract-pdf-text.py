"""PDF text extractor with per-font ToUnicode decoding.

Word-exported PDFs subset their fonts, so a glyph code is not an ASCII code:
the same byte means different letters in different fonts. Decoding with one
merged table is what turns "Breast" into "BreaVt". So the current font is
tracked through the content stream's Tf operators and each string is decoded
with that font's own CMap, falling back to Latin-1 when a font has none.
"""
import re, sys, zlib


def objects(data):
    """Return indirect objects, including PDF 1.5 compressed object streams."""
    out = {}
    for m in re.finditer(rb'(\\d+)\\s+(\\d+)\\s+obj\\b', data):
        end = data.find(b'endobj', m.end())
        if end != -1:
            out[int(m.group(1))] = data[m.end():end]

    # PDF 1.5 may store ordinary page/font/resource dictionaries inside an
    # /ObjStm. They have no literal object marker in the raw file, which is
    # why the old extractor returned zero text for otherwise text-based PDFs.
    # The payload starts with N pairs: object-number and relative-offset.
    for _container_num, body in list(out.items()):
        if not re.search(rb'/Type\\s*/ObjStm\\b|/ObjStm\\b', body):
            continue

        n_match = re.search(rb'/N\\s+(\\d+)\\b', body)
        first_match = re.search(rb'/First\\s+(\\d+)\\b', body)
        if not n_match or not first_match:
            continue

        payload = stream(body)
        if payload is None:
            continue

        count = int(n_match.group(1))
        first = int(first_match.group(1))
        if count <= 0 or first < 0 or first > len(payload):
            continue

        nums = [int(x) for x in re.findall(rb'\\d+', payload[:first])]
        if len(nums) < count * 2:
            continue

        entries = [(nums[i * 2], nums[i * 2 + 1]) for i in range(count)]
        for i, (obj_num, rel_offset) in enumerate(entries):
            obj_start = first + rel_offset
            obj_end = first + entries[i + 1][1] if i + 1 < len(entries) else len(payload)
            if obj_start < first or obj_start > obj_end or obj_end > len(payload):
                continue
            embedded = payload[obj_start:obj_end].strip()
            # Prefer a literal object when both copies exist; an incremental
            # update may leave an older compressed copy behind.
            if embedded and obj_num not in out:
                out[obj_num] = embedded

    return out

def stream(body):
    m = re.search(rb'stream\r?\n', body)
    if not m:
        return None
    raw = body[m.end():body.find(b'endstream', m.end())]
    if b'/FlateDecode' in body[:m.start()]:
        for trim in range(0, 4):
            try:
                return zlib.decompress(raw[:len(raw) - trim] if trim else raw)
            except zlib.error:
                continue
        try:
            return zlib.decompressobj().decompress(raw)
        except zlib.error:
            return None
    return raw


def cmap_table(b):
    t = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', b, re.S):
        for s, d in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            try:
                t[int(s, 16)] = bytes.fromhex(d.decode()).decode('utf-16-be', 'ignore')
            except Exception:
                pass
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', b, re.S):
        for lo, hi, d in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            try:
                a, z, base = int(lo, 16), int(hi, 16), int(d, 16)
                for i in range(a, min(z, a + 4096) + 1):
                    t[i] = chr(base + i - a)
            except Exception:
                pass
    return t


def main(path):
    data = open(path, 'rb').read()
    objs = objects(data)

    # font object number -> unicode table
    font_tables = {}
    for num, body in objs.items():
        m = re.search(rb'/ToUnicode\s+(\d+)\s+\d+\s+R', body)
        if m:
            s = stream(objs.get(int(m.group(1)), b''))
            if s:
                font_tables[num] = cmap_table(s)

    # page content -> {resource name: font object number}
    pages = []
    for num, body in objs.items():
        if b'/Type' in body and re.search(rb'/Type\s*/Page\b', body):
            fonts = {}
            fm = re.search(rb'/Font\s*<<(.*?)>>', body, re.S)
            fdict = fm.group(1) if fm else b''
            if not fm:
                rm = re.search(rb'/Resources\s+(\d+)\s+\d+\s+R', body)
                if rm:
                    res = objs.get(int(rm.group(1)), b'')
                    fm2 = re.search(rb'/Font\s*<<(.*?)>>', res, re.S)
                    if fm2:
                        fdict = fm2.group(1)
                    else:
                        fr = re.search(rb'/Font\s+(\d+)\s+\d+\s+R', res)
                        if fr:
                            fdict = objs.get(int(fr.group(1)), b'')
            for name, ref in re.findall(rb'/([A-Za-z0-9#]+)\s+(\d+)\s+\d+\s+R', fdict):
                fonts[name] = int(ref)
            cm = re.search(rb'/Contents\s+(\d+)\s+\d+\s+R', body)
            cnums = [int(cm.group(1))] if cm else []
            if not cm:
                ca = re.search(rb'/Contents\s*\[(.*?)\]', body, re.S)
                if ca:
                    cnums = [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', ca.group(1))]
            content = b''.join(stream(objs.get(c, b'')) or b'' for c in cnums)
            if content:
                pages.append((content, fonts))

    def decode(tok, table):
        if tok.startswith(b'('):
            raw, out, i = tok[1:-1], [], 0
            while i < len(raw):
                c = raw[i]
                if c == 0x5C and i + 1 < len(raw):
                    nx = raw[i + 1]
                    esc = {0x6E: '\n', 0x72: '\r', 0x74: '\t', 0x28: '(', 0x29: ')', 0x5C: '\\'}
                    if nx in esc:
                        out.append(esc[nx]); i += 2; continue
                    if 0x30 <= nx <= 0x37:
                        mm = re.match(rb'[0-7]{1,3}', raw[i + 1:i + 4])
                        code = int(mm.group(), 8)
                        out.append(table.get(code, chr(code)) if table else chr(code))
                        i += 1 + len(mm.group()); continue
                    i += 2; continue
                out.append(table.get(c, chr(c)) if table else chr(c))
                i += 1
            return ''.join(out)
        hx = re.sub(rb'\s', b'', tok[1:-1])
        if len(hx) % 4 == 0 and table:
            return ''.join(table.get(int(hx[j:j + 4], 16), '') for j in range(0, len(hx), 4))
        try:
            bs = bytes.fromhex(hx.decode())
        except Exception:
            return ''
        return ''.join(table.get(b, chr(b)) if table else chr(b) for b in bs)

    token = re.compile(
        rb'/([A-Za-z0-9#]+)\s+[\d.]+\s+Tf'          # 1 set font
        rb'|(\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]+>)'  # 2 string
        rb'|(T\*|Td|TD|\'|")'                        # 3 line break
    )

    for content, fonts in pages:
        table, line, out = None, [], []
        for m in token.finditer(content):
            if m.group(1):
                table = font_tables.get(fonts.get(m.group(1)), None)
            elif m.group(2):
                line.append(decode(m.group(2), table))
            else:
                if line:
                    out.append(''.join(line)); line = []
        if line:
            out.append(''.join(line))
        text = '\n'.join(s for s in out if s.strip())
        if text.strip():
            print(text)
            print()


def self_test_objstm():
    """Dependency-free regression test for compressed object streams."""
    embedded_5 = b'<< /Type /Page /Contents 7 0 R >>'
    embedded_6 = b'<< /Type /Font /ToUnicode 8 0 R >>'
    header = b'5 0 6 ' + str(len(embedded_5) + 1).encode() + b' '
    payload = header + embedded_5 + b' ' + embedded_6
    compressed = zlib.compress(payload)
    pdf = (
        b'%PDF-1.5\\n10 0 obj\\n'
        + b'<< /Type /ObjStm /N 2 /First '
        + str(len(header)).encode()
        + b' /Length '
        + str(len(compressed)).encode()
        + b' /Filter /FlateDecode >>\\nstream\\n'
        + compressed
        + b'\\nendstream\\nendobj\\n%%EOF\\n'
    )
    found = objects(pdf)
    assert found.get(5) == embedded_5, found.get(5)
    assert found.get(6) == embedded_6, found.get(6)
    print('extract-pdf-text ObjStm self-test: OK')


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--self-test':
        self_test_objstm()
    elif len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        raise SystemExit('usage: extract-pdf-text.py <pdf> | --self-test')
