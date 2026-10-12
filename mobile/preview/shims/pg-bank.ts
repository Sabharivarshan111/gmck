import {decompress} from 'fzstd';
export default {
  async readPack(id: string, sha256: string): Promise<string> {
    if (!/^s\d{2}$/.test(id)) throw new Error('Invalid PG pack');
    const response=await fetch('/pg/'+id+'-'+sha256.slice(0,12)+'.zst');
    if (!response.ok) throw new Error('PG subject is unavailable offline. Open it online once to cache the bank.');
    const packed=new Uint8Array(await response.arrayBuffer());
    if (packed.byteLength>10000000) throw new Error('Oversized PG pack');
    const digest=await crypto.subtle.digest('SHA-256',packed);
    const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(actual!==sha256)throw new Error('PG pack checksum mismatch');
    const decoded=decompress(packed);
    if(decoded.byteLength>20000000)throw new Error('Decoded PG pack is too large');
    return new TextDecoder().decode(decoded);
  },
};
