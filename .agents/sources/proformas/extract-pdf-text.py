"""PDF text extractor with per-font ToUnicode decoding.

Word-exported PDFs subset their fonts, so a glyph code is not an ASCII code:
the same byte means different letters in different fonts. Decoding with one
merged table is what turns "Breast" into "BreaVt". So the current font is
tracked through the content stream's Tf operators and each string is decoded
with that font's own CMap, falling back to Latin-1 when a font has none.
"""
import re, sys, zlib


def objects(data):
    out = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b', data):
        end = data.find(b'endobj', m.end())
        if end != -1:
            out[int(m.group(1))] = data[m.end():end]
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


main(sys.argv[1])
