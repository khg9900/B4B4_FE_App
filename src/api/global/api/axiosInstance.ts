import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { NativeModules } from "react-native";
import { navigate } from "../../../navigation/AppNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authState } from '../../global/utils/authState';
import { stopForegroundService } from "../../location/hooks/startLocationService";

// ✅ 환경별 baseURL
const baseURL = 'http://192.168.1.100:8080/api';
const { JwtModule } = NativeModules;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 인증 제외 URL
const isAuthExcluded = (url?: string) => {
  if (!url) return false;
  const paths = ["/auth/login", "/auth/reissue", "/auth/signup"];
  return paths.some((path) => url.endsWith(path));
};

// 공통 에러 로거
const logError = (label: string, error?: any) => {
  console.error(`❗ ${label}:`, error?.response?.data ?? error?.message ?? error ?? '');
};

// NativeModule에서 accessToken 읽기
const getNativeToken = async (): Promise<string | null> => {
  try {
    const token = await JwtModule.getToken();
    return token ?? null;
  } catch (e) {
    logError("NativeModule 토큰 조회 실패", e);
    return null;
  }
};

// 토큰 삭제 (Native + AsyncStorage)
const clearTokens = async () => {
  try {
    await JwtModule.clearTokens();
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  } catch (e) {
    logError("토큰 삭제 실패", e);
  }
};

// 토큰 저장 (Native + AsyncStorage)
const saveTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    if (refreshToken) {
      await AsyncStorage.multiSet([
        ["accessToken", accessToken],
        ["refreshToken", refreshToken],
      ]);
    } else {
      await AsyncStorage.setItem("accessToken", accessToken);
    }
    await JwtModule.setToken(accessToken, refreshToken ?? "");
  } catch (e) {
    logError("토큰 저장 실패", e);
  }
};

/** Request interceptor: 토큰 첨부 */
axiosInstance.interceptors.request.use(async (config) => {
  if (isAuthExcluded(config.url)) {
    if (config.headers) delete (config.headers as any).Authorization;
    return config;
  }

  const token = await getNativeToken();
  if (!token) {
    logError("AUTH_NO_TOKEN");
    await clearTokens();
    await stopForegroundService();
    navigate("Login");
    return Promise.reject(new Error("No token"));
  }

  config.headers = config.headers ?? {};
  (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

/** Response interceptor: 401 발생 시 로그인 처리 */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as AxiosRequestConfig & { __isRetryRequest?: boolean };

    if (!originalRequest || isAuthExcluded(originalRequest.url)) return Promise.reject(err);

    if (err.response?.status === 401 && !originalRequest.__isRetryRequest) {
      if (authState.isAutoLoggingIn) {
        logError('401 (자동로그인 중)', err);
        return Promise.reject(err);
      }

      logError("401 토큰 만료", err);
      await clearTokens();
      await stopForegroundService();
      navigate("Login");
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
export { clearTokens, saveTokens };
