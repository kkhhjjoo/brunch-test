import axios, { AxiosInstance } from "axios";

const API_SERVER = "https://fesp-api.koyeb.app/market";

const api: AxiosInstance = axios.create({
  baseURL: API_SERVER,
  withCredentials: true, // JWT가 아니라 쿠키 인증을 쓴다면 유지
});

export interface User {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiItemResponse<T> {
  ok: boolean;
  message?: string;
  data?: T;
  item?: T;
}

export interface ApiListResponse<T> {
  ok: boolean;
  message?: string;
  items?: T[];
  data?: T[];
}

/**
 * 회원가입 (OAuth 포함)
 */
export const registerUser = async (userData: User): Promise<ApiItemResponse<User>> => {
  const { data } = await api.post<ApiItemResponse<User>>("/users/signup/oauth", userData);
  return data;
};

/**
 * 회원 목록 조회
 */
export const getUserList = async (): Promise<ApiListResponse<User>> => {
  const { data } = await api.get<ApiListResponse<User>>("/users");
  return data;
};

/**
 * 회원 상세 조회
 */
export const getUserById = async (id: string): Promise<ApiItemResponse<User>> => {
  const { data } = await api.get<ApiItemResponse<User>>(`/users/${id}`);
  return data;
};

/**
 * 회원 정보 수정
 */
export const updateUser = async (id: string, updateData: Partial<User>): Promise<ApiItemResponse<User>> => {
  const { data } = await api.put<ApiItemResponse<User>>(`/users/${id}`, updateData);
  return data;
};

/**
 * 로그인
 */
export const loginUser = async (loginData: { email: string; password: string }) => {
  const { data } = await api.post("/users/login", loginData);
  return data;
};

export default {
  registerUser,
  getUserList,
  getUserById,
  updateUser,
  loginUser,
};
