import { Route, Routes } from "react-router";
import { ExplorePage } from "./pages/ExplorePage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ResendVerificationPage } from "./pages/ResendVerificationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/explore"
        element={
          <RequireAuth>
            <ExplorePage />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
