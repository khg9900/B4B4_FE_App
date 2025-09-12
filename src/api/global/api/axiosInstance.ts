import axios, { AxiosError, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode} from "jwt-decode";
import { navigate } from "../../../navigation/AppNavigation";
import { NativeModules } from 'react-native';

const localIP = "192.168.25.177";
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

// 동시 재발급 제어
let isRefreshing = false;
let waiters: Array<(token: string | null, err?: any) => void> = [];

// 토큰 헬퍼
export const getAccessToken = async () => (await AsyncStorage.getItem("accessToken"))?.trim();
export const getRefreshToken = async () => (await AsyncStorage.getItem("refreshToken"))?.trim();
export const saveTokens = async (accessToken: string, refreshToken?: string) => {
  if (refreshToken) {
    await AsyncStorage.multiSet([
      ["accessToken", accessToken],
      ["refreshToken", refreshToken],
    ]);
  } else {
    await AsyncStorage.setItem("accessToken", accessToken);
  }
};
export const clearTokens = async () =>
  await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);

// JWT 만료 체크
type JWTPayload = { exp: number };
const isTokenExpired = (token: string) => {
  try {
    const { exp } = jwtDecode<JWTPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true; // decode 실패 시 만료 처리
  }
};

// refreshToken으로 accessToken 재발급
const reissueToken = async (): Promise<string> => {
  const rt = await getRefreshToken();
  if (!rt) throw new Error("refreshToken 없음");

  
  const res = await axiosInstance.post("/auth/reissue", { refreshToken: rt });
  const newAT = res.data?.payload?.accessToken;
  const newRT = res.data?.payload?.refreshToken;

  if (!newAT) throw new Error("accessToken이 없습니다");

  await saveTokens(newAT, newRT);
  axiosInstance.defaults.headers.Authorization = `Bearer ${newAT}`;
  JwtModule.setToken(newAT, newRT);

  return newAT;
};

// accessToken 보장 + 동시 재발급 처리
async function ensureValidToken(): Promise<string> {
  const at = await getAccessToken();
  if (!at) throw new Error("accessToken 없음");

  if (!isTokenExpired(at)) return at;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      waiters.push((t, err) => (t ? resolve(t) : reject(err)));
    });
  }

  try {
    isRefreshing = true;
    const newAT = await reissueToken();
    waiters.forEach((cb) => cb(newAT));
    waiters = [];
    return newAT;
  } catch (e) {
    waiters.forEach((cb) => cb(null, e));
    waiters = [];
    await clearTokens();
    throw e;
  } finally {
    isRefreshing = false;
  }
}

/** Request interceptor: 토큰 첨부 */
axiosInstance.interceptors.request.use(async (config) => {
  
  if (isAuthExcluded(config.url)) {
    if (config.headers) delete config.headers.Authorization;
    return config;
  }

  try {
    const validAT = await ensureValidToken();
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${validAT}`;
  } catch (e) {
    console.warn("토큰 재발급 실패, 로그인 필요", e);
    await clearTokens();
    navigate("Login");
    return Promise.reject(e);
  }

  return config;
});

/** Response interceptor: 401 발생 시 재발급 + 재시도 */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as AxiosRequestConfig & { __isRetryRequest?: boolean };

    if (!originalRequest || isAuthExcluded(originalRequest.url)) return Promise.reject(err);

    // 401 && 아직 재시도 안함
    if (err.response?.status === 401 && !originalRequest.__isRetryRequest) {
      try {
        originalRequest.__isRetryRequest = true;
        const newAT = await ensureValidToken();
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newAT}`;
        return axiosInstance.request(originalRequest);
      } catch (e) {
        await clearTokens();
        navigate("Login");
        return Promise.reject(e);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
