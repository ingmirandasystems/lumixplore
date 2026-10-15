import { Outlet } from "react-router";
import { AppHeader } from "../components/layout/AppHeader";

export function AppLayout() {
  return (
    <div className="app-layout">
      <AppHeader />
      <Outlet />
    </div>
  );
}
