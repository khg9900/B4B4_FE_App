import { Alert } from "react-native";

// ErrorCode enum
export enum ErrorCode {
  DUPLICATED_EMAIL = "AU007",
  INVALID_PASSWORD = "AU008",
  USER_NOT_FOUND = "AU009",
  VOLUNTEER_CONFLICT = "VO008",
  VOLUNTEER_ALREADY_PARTICIPATED = "VO011",
  VOLUNTEER_POST_CLOSED = "VO012",
  VOLUNTEER_CHECKIN_TOO_LATE = "VO013",
  VOLUNTEER_CHECKIN_CONFLICT = "VO014",
  VOLUNTEER_CAPACITY_EXCEEDED = "VO015",
  VOLUNTEER_NOT_FOUND = "VO004",
  VOLUNTEER_FORBIDDEN = "VO003",
  REDIS_SERVER_ERROR = "VO010",
  INVALID_REQUEST = "C002",
}

// Error 메시지 매핑
const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.DUPLICATED_EMAIL]: "이미 존재하는 이메일입니다.",
  [ErrorCode.INVALID_PASSWORD]: "비밀번호가 일치하지 않습니다.",
  [ErrorCode.USER_NOT_FOUND]: "회원가입 후 로그인 해주세요.",
  [ErrorCode.VOLUNTEER_CONFLICT]: "다른 활동과 일정이 겹칩니다.",
  [ErrorCode.VOLUNTEER_ALREADY_PARTICIPATED]: "이미 참여한 팀입니다.",
  [ErrorCode.VOLUNTEER_POST_CLOSED]: "모집이 마감된 게시글입니다.",
  [ErrorCode.VOLUNTEER_CHECKIN_TOO_LATE]: "체크인 시작 5분 전 이후에는 참여할 수 없습니다.",
  [ErrorCode.VOLUNTEER_CHECKIN_CONFLICT]: "다른 봉사 활동과 체크인 시간이 겹칩니다.",
  [ErrorCode.VOLUNTEER_CAPACITY_EXCEEDED]: "팀 정원이 초과되어 참여할 수 없습니다.",
  [ErrorCode.VOLUNTEER_NOT_FOUND]: "봉사 정보를 찾을 수 없습니다.",
  [ErrorCode.VOLUNTEER_FORBIDDEN]: "권한이 없습니다.",
  [ErrorCode.REDIS_SERVER_ERROR]: "팀 인원이 가득 찼거나 서버 문제가 발생했습니다.",
  [ErrorCode.INVALID_REQUEST]: "유효하지 않은 요청입니다.",
};

// 서버 응답 타입 정의
export type ErrorResponsePayload = {
  field: string;
  rejectedValue?: any;
  message: string;
};

export type ErrorResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  payload?: ErrorResponsePayload[];
};

// Alert 발생 함수 (payload 대응)
export function showErrorAlert(
  code: ErrorCode,
  payload?: ErrorResponsePayload[]
) {
  // payload가 있으면 상세 메시지, 없으면 기본 메시지
  const message = payload?.length
    ? payload.map((p) => `• ${p.message}`).join("\n")
    : errorMessages[code] || "알 수 없는 오류가 발생했습니다.";

  Alert.alert("❌ 오류", message);
}
