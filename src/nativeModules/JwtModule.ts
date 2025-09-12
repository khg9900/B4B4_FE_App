// JwtService.ts
import { NativeModules } from 'react-native';
const { JwtModule } = NativeModules;

export default class JwtService {
  static async setToken(token: string, refreshToken?: string) {
    JwtModule.setToken(token);
    // 필요 시 refreshToken 저장 로직 추가
  }

  static async getToken(): Promise<string | null> {
    try {
      return await JwtModule.getToken();
    } catch (e) {
      return null;
    }
  }

  static async refreshToken(): Promise<string | null> {
    try {
      return await JwtModule.refreshToken(); // 네이티브에서 구현 필요
    } catch (e) {
      return null;
    }
  }
}
