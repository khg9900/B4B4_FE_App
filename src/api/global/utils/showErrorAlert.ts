import { Alert } from "react-native";

// 서버에서 내려주는 에러 타입
export type ServerError = {
  isSuccess: boolean;
  code: string;       // 서버 ErrorStatus.code
  message: string;    // 서버에서 내려주는 실제 메시지
  payload?: { field: string; rejectedValue?: any; message: string }[];
};

// 서버 메시지 기반 Alert 함수
export function showServerErrorAlert(error: ServerError) {
  // payload가 있으면 상세 메시지, 없으면 서버 메시지 그대로
  const message = error.payload?.length
    ? error.payload.map((p) => `• ${p.message}`).join("\n")
    : error.message || "알 수 없는 오류가 발생했습니다.";

  Alert.alert("❌ 오류", message);
}
