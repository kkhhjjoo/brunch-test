import axios from 'axios';

// ✅ 기본 서버 주소 설정
const API_SERVER = 'https://fesp-api.koyeb.app/market';

// ✅ axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_SERVER}`,
  withCredentials: true, // 쿠키나 세션을 사용하는 경우
});

// ✅ 타입 정의 (예시)
export interface User {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  provider?: string;
}

// ✅ 회원가입
export const registerUser = async (userData: User) => {
  const { data } = await api.post('/users/signup', userData);
  return data;
};

// ✅ 회원 목록 조회 (관리자용)
export const getUserList = async () => {
  const { data } = await api.get('/users');
  return data;
};

// ✅ 이메일 중복 체크
export const checkEmailDuplicate = async (email: string) => {
  const { data } = await api.get(`/users/email/${email}`);
  return data;
};

// ✅ 이름 중복 체크
export const checkNameDuplicate = async (name: string) => {
  const { data } = await api.get(`/users/name/${name}`);
  return data;
};

// ✅ Oauth 인증 후 자동 회원가입
export const oauthSignup = async (oauthData: { provider: string; token: string }) => {
  const { data } = await api.post('/users/signup/oauth', oauthData);
  return data;
};

// ✅ 일반 로그인
export const loginUser = async (loginData: { email: string; password: string }) => {
  const { data } = await api.post('/users/login', loginData);
  return data;
};

// ✅ 카카오 로그인
export const kakaoLogin = async (code: string) => {
  const { data } = await api.post('/users/login/kakao', { code });
  return data;
};

// ✅ 로그인 with (예: Google, Naver 등 통합 로그인)
export const loginWith = async (provider: string, token: string) => {
  const { data } = await api.post('/users/login/with', { provider, token });
  return data;
};

// ✅ 회원정보 수정
export const updateUser = async (_id: string, updateData: Partial<User>) => {
  const { data } = await api.put(`/users/${_id}`, updateData);
  return data;
};

// ✅ (선택) 로그아웃
export const logoutUser = async () => {
  const { data } = await api.post('/users/logout');
  return data;
};
