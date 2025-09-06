// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Existing mappings
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  
  // Tab bar icons
  'camera.fill': 'camera-alt',
  'photo.stack': 'photo-library',
  'gearshape.fill': 'settings',
  
  // Additional common icons
  'chevron.left': 'chevron-left',
  'plus': 'add',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'pencil': 'edit',
  'trash': 'delete',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'arrow.up.right.square': 'open-in-new',
  'sparkles': 'auto-awesome',
  'square.and.arrow.up': 'share',
  'square.and.arrow.down': 'file-download',
  'photo': 'collections',
  'photo.fill': 'collections',
  'square': 'photo',
  'circle': 'settings',
  'folder': 'folder',
  'grid.circle': 'grid-view',
  'slider.horizontal.3': 'tune',
  'bolt.slash': 'flash-off',
  'gearshape': 'settings',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
