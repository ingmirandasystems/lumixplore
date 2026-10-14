import { createContext } from "react";
import type {
  AuthUser,
  LoginCredentials,
  GoogleLoginData,
  ChangePasswordData,
} from "../services/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  googleLogin: (data: GoogleLoginData) => Promise<void>;
  updateLanguage: (language: "es" | "en") => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateRegion: (region: string) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
