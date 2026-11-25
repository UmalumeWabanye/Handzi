import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { UploadKind } from '@handyconnect/shared';
import { uploadApi } from '@/api/endpoints';

export type PickSource = 'camera' | 'library';
type Options = { source: PickSource; square?: boolean; frontCamera?: boolean };

/** Let the user take or choose a photo. Returns a local asset, or null if cancelled/denied. */
export async function pickImage({ source, square, frontCamera }: Options) {
  const perm =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      source === 'camera' ? 'Camera access needed' : 'Photo access needed',
      'You can allow access in your phone settings.'
    );
    return null;
  }
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7, // also converts HEIC to JPEG on iOS
    allowsEditing: !!square,
    aspect: square ? [1, 1] : undefined,
    cameraType: frontCamera ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
  };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

export async function uploadAsset(asset: ImagePicker.ImagePickerAsset, kind: UploadKind) {
  const type = asset.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  return uploadApi.upload({ uri: asset.uri, name: asset.fileName ?? `${kind}.${ext}`, type }, kind);
}
