// 예) src/nativeModules/JwtModule.ts
import { NativeModules } from 'react-native';

const { JwtModule } = NativeModules;

export function setJwtToken(token: string) {
  JwtModule.setToken(token);
}
