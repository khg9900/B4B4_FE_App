// 역할 타입
export type UserRole = 'IND' | 'NGO' | 'GOV';

// 로그인 방식 타입
export type LoginType = 'LOCAL' | 'GOOGLE' | 'KAKAO';

// 회원가입 요청 DTO
export interface SignUpRequestDto {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  province: string;
  userRole: UserRole;
  loginType: LoginType;
}

// 로그인 요청 DTO
export interface LoginRequestDto {
  email: string;
  password?: string;
  loginType: LoginType;
  provider?: string | null; // 소셜 로그인 시만 사용
}
