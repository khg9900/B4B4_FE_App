// 역할 타입
export type UserRole = 'IND' | 'NGO' | 'GOV';

// 회원가입 요청 DTO
export interface SignUpRequestDto {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  province?: string;
  city?: string;     
  userRole: UserRole;
}

// 로그인 요청 DTO
export interface LoginRequestDto {
  email: string;
  password?: string;
}
