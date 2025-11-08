// apis.ts
import axios, { AxiosInstance } from "axios";

// ✅ Axios 인스턴스 생성
const API = axios.create({
  baseURL: "https://fesp-api.koyeb.app/market",
  withCredentials: true, // 쿠키 기반 인증 시 필요
});

// ✅ 회원 관련 타입 정의
export interface MemberRegisterReq {
  id: string;
  pw: string;
  name: string;
  email?: string;
}

export interface MemberLoginReq {
  id: string;
  pw: string;
}

export interface MemberRes {
  ok: boolean;
  message: string;
  token?: string;
  data?: {
    id: string;
    name: string;
    email?: string;
  };
}

// ✅ 회원가입
export const registerMember = async (payload: MemberRegisterReq): Promise<MemberRes> => {
  const { data } = await API.post<MemberRes>("/member/register", payload);
  return data;
};

// ✅ 로그인
export const loginMember = async (payload: MemberLoginReq): Promise<MemberRes> => {
  const { data } = await API.post<MemberRes>("/member/login", payload);
  return data;
};

// ✅ 로그아웃
export const logoutMember = async (): Promise<MemberRes> => {
  const { data } = await API.post<MemberRes>("/member/logout");
  return data;
};

// ✅ 회원정보 조회
export const getMemberInfo = async (): Promise<MemberRes> => {
  const { data } = await API.get<MemberRes>("/member/info");
  return data;
};

// ✅ 기본 내보내기
export default {
  registerMember,
  loginMember,
  logoutMember,
  getMemberInfo,
};
