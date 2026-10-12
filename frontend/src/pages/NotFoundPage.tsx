import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main>
      <h1>404 — Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}
