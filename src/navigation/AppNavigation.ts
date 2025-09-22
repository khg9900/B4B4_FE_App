import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

// 네비게이션 전역 Ref
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// 어디서든 전역적으로 navigate 가능
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
