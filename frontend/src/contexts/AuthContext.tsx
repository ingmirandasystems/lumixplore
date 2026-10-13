import { createContext } from "react";
import type {
  AuthUser,
  LoginCredentials,
  GoogleLoginData,
} from "../services/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  googleLogin: (data: GoogleLoginData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
