import { Link } from "react-router";
import "./AppFooter.css";

export function AppFooter() {
  return (
    <div className="app-footer-container">
      <footer className="app-footer">
        <nav
          className="app-footer__links"
          aria-label="Enlaces del pie de página"
        >
          <ul>
            <li>
              <Link to="/terms">Términos de uso</Link>
            </li>
          </ul>

          <ul>
            <li>
              <Link to="/privacy">Política de privacidad</Link>
            </li>
          </ul>

          <ul>
            <li>
              <Link to="/cookies">Política de cookies</Link>
            </li>
          </ul>
        </nav>

        <div className="app-footer__credits">
          <p>
            Los datos e imágenes de películas y series son proporcionados por{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB
            </a>
            .
          </p>

          <p>© {new Date().getFullYear()} LumiXplore</p>
        </div>
      </footer>
    </div>
  );
}
