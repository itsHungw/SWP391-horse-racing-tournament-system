export interface UserAuthDto {
  id: number;
  email: string;
  fullName: string;
}

export interface LoginResponse {
  accessToken: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
}
