import type { ReactNode } from "react";
import {
  AnimatedBackground,
  type BackgroundColors,
} from "../components/background/AnimatedBackground";
import "./PageShell.css";

interface PageShellProps {
  colors: BackgroundColors;
  children: ReactNode;
}

export function PageShell({ colors, children }: PageShellProps) {
  return (
    <div className="page-shell">
      <AnimatedBackground colors={colors} />

      <div className="page-shell__content">{children}</div>
    </div>
  );
}
