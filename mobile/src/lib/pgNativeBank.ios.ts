import {Image} from 'react-native';
import {sha256} from '@noble/hashes/sha256';
import {decompress} from 'fzstd';
import {decodeUtf8} from '@shared/apkgFormat';
import {IOS_PG_ASSETS} from './pgCompact/assets.ios';
import {PG_COMPACT} from './pgCompact/manifest';

/** Read the same immutable packs from the iOS app bundle, without an Android TurboModule. */
export default {
  async readPack(id: string, expectedSha256: string): Promise<string> {
    const pack = PG_COMPACT.packs.find(item => item.id === id);
    if (!pack || expectedSha256 !== pack.sha256 || !Object.hasOwn(IOS_PG_ASSETS, id)) {
      throw new Error('Invalid PG pack');
    }
    const asset = Image.resolveAssetSource(IOS_PG_ASSETS[id]);
    if (!asset?.uri || (!__DEV__ && !asset.uri.startsWith('file://'))) {
      throw new Error('The offline practice pack is not bundled in this iOS build.');
    }
    const response = await fetch(asset.uri);
    if (!response.ok && response.status !== 0) throw new Error('The bundled practice pack could not be read.');
    const packed = new Uint8Array(await response.arrayBuffer());
    if (packed.byteLength > 10_000_000) throw new Error('Oversized PG pack');
    const actual = Array.from(sha256(packed), byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== expectedSha256) throw new Error('PG pack checksum mismatch');
    const decoded = decompress(packed);
    if (decoded.byteLength > 20_000_000) throw new Error('Decoded PG pack is too large');
    return decodeUtf8(decoded);
  },
};
