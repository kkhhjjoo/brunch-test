import axios, { AxiosInstance } from "axios";

const API_SERVER = "https://fesp-api.koyeb.app/market";

const api: AxiosInstance = axios.create({
  baseURL: API_SERVER,
  withCredentials: true,
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

export const registerUser = async (userData: User): Promise<ApiItemResponse<User>> => {
  const { data } = await api.post<ApiItemResponse<User>>("/users/signup", userData);
  return data;
};

export const getUserList = async (): Promise<ApiListResponse<User> | User[]> => {
  const { data } = await api.get<ApiListResponse<User> | User[]>("/users");
  return data;
};

export const getUserById = async (id: string): Promise<ApiItemResponse<User>> => {
  const { data } = await api.get<ApiItemResponse<User>>(`/users/${id}`);
  return data;
};

export const updateUser = async (id: string, updateData: Partial<User>): Promise<ApiItemResponse<User>> => {
  const { data } = await api.put<ApiItemResponse<User>>(`/users/${id}`, updateData);
  return data;
};

export const deleteUser = async (id: string): Promise<ApiItemResponse<null>> => {
  const { data } = await api.delete<ApiItemResponse<null>>(`/users/${id}`);
  return data;
};

export const checkEmailDuplicate = async (email: string) => {
  const { data } = await api.get(`/users/email/${email}`);
  return data;
};

export const checkNameDuplicate = async (name: string) => {
  const { data } = await api.get(`/users/name/${name}`);
  return data;
};

export const loginUser = async (loginData: { email: string; password: string }) => {
  const { data } = await api.post("/users/login", loginData);
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post("/users/logout");
  return data;
};

export default {
  registerUser,
  getUserList,
  getUserById,
  updateUser,
  deleteUser,
  checkEmailDuplicate,
  checkNameDuplicate,
  loginUser,
  logoutUser,
};
