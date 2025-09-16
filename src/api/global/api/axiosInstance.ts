import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { NativeModules } from "react-native";
import { navigate } from "../../../navigation/AppNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ 환경별 baseURL
const localIP = '192.168.1.100';
const baseURL = `http://${localIP}:8080/api`;
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

// NativeModule에서 accessToken 읽기
const getNativeToken = async (): Promise<string | null> => {
  try {
    const token = await JwtModule.getToken();
    return token ?? null;
  } catch (e) {
    console.warn("NativeModule에서 토큰 가져오기 실패", e);
    return null;
  }
};

// 토큰 삭제 (Native + AsyncStorage)
const clearTokens = async () => {
  try {
    await JwtModule.clearTokens();
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  } catch (e) {
    console.warn("토큰 삭제 실패", e);
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
    console.warn("토큰 저장 실패", e);
  }
};

/** Request interceptor: 토큰 첨부 */
axiosInstance.interceptors.request.use(async (config) => {
  if (isAuthExcluded(config.url)) {
    if (config.headers) delete config.headers.Authorization;
    return config;
  }

  const token = await getNativeToken();
  if (!token) {
    console.warn("토큰 없음 → 로그인 화면으로 이동");
    await clearTokens();
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
      console.warn("401 발생 → 토큰 만료 또는 권한 문제, 로그인 화면으로 이동");
      await clearTokens();
      navigate("Login");
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
export { clearTokens, saveTokens };
