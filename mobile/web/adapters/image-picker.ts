import { pickFile } from './files';
export async function launchImageLibrary(options: any, callback?: (result: any) => void) {
  const file = await pickFile(options.mediaType === 'video' ? 'video/*' : options.mediaType === 'mixed' ? 'image/*,video/*' : 'image/*');
  const result = file ? { assets: [{ uri: URL.createObjectURL(file), type: file.type, fileName: file.name, fileSize: file.size }] } : { didCancel: true };
  callback?.(result); return result;
}
