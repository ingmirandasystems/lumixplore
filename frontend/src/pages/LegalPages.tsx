import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import "./LegalPages.css";
import { usePageTitle } from "../hooks/usePageTitle";

type LegalPageId = "terms" | "privacy" | "cookies";

interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalContent {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
}

const content: Record<"es" | "en", Record<LegalPageId, LegalContent>> = {
  es: {
    terms: {
      eyebrow: "Información del servicio",
      title: "Términos de uso",
      description:
        "Conoce cómo funciona LumiXplore y las condiciones para utilizar tu cuenta.",
      sections: [
        {
          title: "1. Qué es LumiXplore",
          paragraphs: [
            "LumiXplore es una aplicación para descubrir películas y series, explorar recomendaciones y organizar una lista personal de títulos.",
            "LumiXplore no reproduce ni distribuye las películas y series de su catálogo. La información sobre dónde ver un título sirve como referencia para encontrar servicios externos.",
          ],
        },
        {
          title: "2. Tu cuenta",
          paragraphs: [
            "Al crear una cuenta, proporciona información correcta y utiliza una dirección de correo a la que tengas acceso.",
            "Cuida tus credenciales y evita compartir tu contraseña. Si utilizas Google para acceder, protege también esa cuenta.",
          ],
        },
        {
          title: "3. Uso de la aplicación",
          paragraphs: [
            "Utiliza LumiXplore de forma responsable y sin perjudicar a otras personas ni al funcionamiento del servicio.",
          ],
          items: [
            "No intentes acceder a cuentas o información ajenas.",
            "No utilices la aplicación para realizar actividades fraudulentas.",
            "No intentes evadir los controles de acceso o interferir con el servicio.",
          ],
        },
        {
          title: "4. Información y recomendaciones",
          paragraphs: [
            "Los datos del catálogo pueden estar incompletos, cambiar o contener errores. Las recomendaciones son orientativas y no garantizan que un título coincida con tus gustos.",
            "La disponibilidad de una película o serie depende de la región y de cada proveedor. Comprueba sus condiciones, precios y disponibilidad antes de contratar un servicio.",
          ],
        },
        {
          title: "5. Contenido de terceros",
          paragraphs: [
            "Los datos e imágenes del catálogo proceden de TMDB y de las fuentes indicadas en la aplicación. Las marcas, imágenes y demás materiales pertenecen a sus respectivos titulares.",
            "LumiXplore utiliza la API de TMDB, pero no cuenta con su respaldo ni certificación.",
          ],
        },
        {
          title: "6. Servicios externos",
          paragraphs: [
            "Al abrir enlaces a plataformas de streaming, Google, YouTube u otros servicios, pueden aplicarse sus propios términos y políticas.",
          ],
        },
        {
          title: "7. Eliminación de la cuenta",
          paragraphs: [
            "Puedes solicitar la eliminación de tu cuenta desde Configuración, siguiendo los pasos de confirmación que muestra la aplicación.",
            "Consulta la Política de privacidad para conocer cómo se gestionan los datos asociados a tu cuenta.",
          ],
        },
        {
          title: "8. Cambios en el servicio",
          paragraphs: [
            "Las funciones de LumiXplore pueden evolucionar. Esta página deberá actualizarse cuando cambien las condiciones de uso del servicio.",
          ],
        },
      ],
    },

    privacy: {
      eyebrow: "Tus datos",
      title: "Política de privacidad",
      description:
        "Qué información utiliza LumiXplore y cómo se relaciona con tu cuenta y tus preferencias.",
      sections: [
        {
          title: "1. Responsable y contacto",
          paragraphs: [
            "Antes de publicar esta política, debe indicarse quién es responsable del tratamiento de los datos y un medio de contacto para consultas y solicitudes de privacidad.",
          ],
        },
        {
          title: "2. Información de la cuenta",
          paragraphs: [
            "LumiXplore utiliza información como tu nombre, correo electrónico, región e idioma para gestionar tu cuenta y personalizar la experiencia.",
            "Si accedes con Google, la aplicación recibe los datos necesarios para identificar tu cuenta mediante ese servicio.",
          ],
        },
        {
          title: "3. Preferencias y lista personal",
          paragraphs: [
            "La aplicación guarda las preferencias que seleccionas, como el tipo de contenido, los géneros y las plataformas, además de los títulos que añades a tu lista.",
            "Esta información permite conservar tus elecciones y adaptar el catálogo y las recomendaciones disponibles.",
          ],
        },
        {
          title: "4. Para qué se utiliza la información",
          items: [
            "Crear y gestionar tu cuenta.",
            "Mantener y verificar tu sesión.",
            "Guardar tus preferencias y tu lista.",
            "Adaptar la experiencia al idioma y la región.",
            "Gestionar cambios de cuenta y solicitudes de eliminación.",
          ],
        },
        {
          title: "5. Servicios que intervienen",
          paragraphs: [
            "LumiXplore utiliza servicios externos para determinadas funciones, como Google para el acceso con una cuenta de Google y TMDB para consultar información del catálogo.",
            "Si reproduces un tráiler integrado o visitas un enlace externo, el proveedor correspondiente puede recibir información técnica de tu dispositivo o conexión.",
            "Antes del lanzamiento, esta sección debe completarse con los proveedores reales de alojamiento, base de datos y cualquier herramienta adicional utilizada.",
          ],
        },
        {
          title: "6. Conservación y eliminación",
          paragraphs: [
            "Puedes iniciar la eliminación de tu cuenta desde Configuración.",
            "Antes de publicar esta política, deben especificarse los plazos de conservación y qué ocurre con los datos eliminados, los registros técnicos y las copias de seguridad.",
          ],
        },
        {
          title: "7. Solicitudes sobre tus datos",
          paragraphs: [
            "Para solicitar acceso, corrección o eliminación de información, utiliza el medio de contacto de privacidad que se indique en esta página.",
            "Los datos que la aplicación permite editar directamente pueden actualizarse desde Configuración.",
          ],
        },
        {
          title: "8. Cookies y almacenamiento local",
          paragraphs: [
            "La aplicación utiliza mecanismos del navegador para mantener la sesión y recordar determinadas elecciones, como el idioma.",
            "Puedes consultar más información en la Política de cookies.",
          ],
        },
      ],
    },

    cookies: {
      eyebrow: "Tu navegador",
      title: "Política de cookies",
      description:
        "Cómo utiliza LumiXplore las cookies y otras formas de almacenamiento del navegador.",
      sections: [
        {
          title: "1. Qué son las cookies",
          paragraphs: [
            "Las cookies son pequeños datos que un sitio puede guardar en tu navegador y enviar al servidor en determinadas solicitudes.",
            "El almacenamiento local es un mecanismo diferente: permite recordar información en el navegador, como una preferencia de idioma.",
          ],
        },
        {
          title: "2. Sesión y acceso",
          paragraphs: [
            "LumiXplore utiliza cookies relacionadas con la autenticación para reconocer tu sesión y permitir el acceso a las funciones de tu cuenta.",
            "Bloquear o eliminar estas cookies puede cerrar tu sesión o impedir que algunas funciones estén disponibles.",
          ],
        },
        {
          title: "3. Preferencia de idioma",
          paragraphs: [
            "La aplicación guarda tu elección de idioma en el almacenamiento local con la clave «lumixplore.language».",
            "Esto permite recordar el idioma elegido cuando vuelves a utilizar la aplicación en el mismo navegador.",
          ],
        },
        {
          title: "4. Servicios de terceros",
          paragraphs: [
            "Funciones como el acceso con Google o la reproducción de tráileres integrados pueden implicar comunicaciones con servicios externos.",
            "El comportamiento de estos servicios y sus mecanismos de almacenamiento dependen de su configuración y de sus propias políticas.",
          ],
        },
        {
          title: "5. Cómo gestionar el almacenamiento",
          items: [
            "Puedes eliminar las cookies y los datos del sitio desde la configuración de tu navegador.",
            "Eliminar los datos locales puede restablecer tus preferencias guardadas en ese navegador.",
            "Borrar las cookies no elimina por sí solo tu cuenta ni la información guardada en el servidor.",
          ],
        },
        {
          title: "6. Inventario pendiente de revisión",
          paragraphs: [
            "Antes del lanzamiento, esta política debe completarse con los nombres reales de las cookies, su finalidad, duración y proveedor.",
            "Si se añaden herramientas de analítica, publicidad u otros servicios, deberá revisarse esta información y la gestión de preferencias que corresponda.",
          ],
        },
      ],
    },
  },

  en: {
    terms: {
      eyebrow: "Service information",
      title: "Terms of use",
      description:
        "Learn how LumiXplore works and the conditions for using your account.",
      sections: [
        {
          title: "1. About LumiXplore",
          paragraphs: [
            "LumiXplore helps you discover movies and TV shows, explore recommendations and organize a personal watchlist.",
            "LumiXplore does not stream or distribute the movies and shows in its catalog. Watch availability information helps you find external services.",
          ],
        },
        {
          title: "2. Your account",
          paragraphs: [
            "When creating an account, provide accurate information and use an email address you can access.",
            "Keep your credentials secure and avoid sharing your password. If you sign in with Google, protect that account as well.",
          ],
        },
        {
          title: "3. Using the application",
          paragraphs: [
            "Use LumiXplore responsibly without harming other people or interfering with the service.",
          ],
          items: [
            "Do not attempt to access other accounts or private information.",
            "Do not use the application for fraudulent activities.",
            "Do not bypass access controls or disrupt the service.",
          ],
        },
        {
          title: "4. Information and recommendations",
          paragraphs: [
            "Catalog information may be incomplete, change or contain errors. Recommendations are suggestions and do not guarantee that a title will match your preferences.",
            "Availability depends on your region and each provider. Check their terms, prices and availability before purchasing a service.",
          ],
        },
        {
          title: "5. Third-party content",
          paragraphs: [
            "Catalog data and images come from TMDB and the sources identified in the application. Trademarks, images and other materials belong to their respective owners.",
            "LumiXplore uses the TMDB API but is not endorsed or certified by TMDB.",
          ],
        },
        {
          title: "6. External services",
          paragraphs: [
            "When opening links to streaming platforms, Google, YouTube or other services, their own terms and policies may apply.",
          ],
        },
        {
          title: "7. Account deletion",
          paragraphs: [
            "You can request account deletion from Settings by completing the confirmation steps shown in the application.",
            "See the Privacy policy for information about how account data is handled.",
          ],
        },
        {
          title: "8. Service changes",
          paragraphs: [
            "LumiXplore features may evolve. This page should be updated whenever the conditions for using the service change.",
          ],
        },
      ],
    },

    privacy: {
      eyebrow: "Your data",
      title: "Privacy policy",
      description:
        "What information LumiXplore uses and how it relates to your account and preferences.",
      sections: [
        {
          title: "1. Responsible party and contact",
          paragraphs: [
            "Before this policy is published, it must identify the party responsible for processing personal data and provide a contact method for privacy questions and requests.",
          ],
        },
        {
          title: "2. Account information",
          paragraphs: [
            "LumiXplore uses information such as your name, email address, region and language to manage your account and personalize the experience.",
            "If you sign in with Google, the application receives the information needed to identify your account through that service.",
          ],
        },
        {
          title: "3. Preferences and watchlist",
          paragraphs: [
            "The application stores your selected preferences, such as content type, genres and providers, along with the titles you add to your watchlist.",
            "This information preserves your choices and helps adapt the available catalog and recommendations.",
          ],
        },
        {
          title: "4. How information is used",
          items: [
            "Create and manage your account.",
            "Maintain and verify your session.",
            "Save your preferences and watchlist.",
            "Adapt the experience to your language and region.",
            "Handle account changes and deletion requests.",
          ],
        },
        {
          title: "5. External services",
          paragraphs: [
            "LumiXplore uses external services for certain features, including Google for Google account sign-in and TMDB for catalog information.",
            "When you play an embedded trailer or visit an external link, the provider may receive technical information about your device or connection.",
            "Before launch, this section must identify the actual hosting, database and other service providers used by the application.",
          ],
        },
        {
          title: "6. Retention and deletion",
          paragraphs: [
            "You can start the account deletion process from Settings.",
            "Before this policy is published, it must specify retention periods and explain how deleted data, technical logs and backups are handled.",
          ],
        },
        {
          title: "7. Requests about your data",
          paragraphs: [
            "To request access, correction or deletion of information, use the privacy contact method listed on this page.",
            "Information that the application allows you to edit directly can be updated from Settings.",
          ],
        },
        {
          title: "8. Cookies and local storage",
          paragraphs: [
            "The application uses browser mechanisms to maintain your session and remember certain choices, such as your language.",
            "See the Cookie policy for more information.",
          ],
        },
      ],
    },

    cookies: {
      eyebrow: "Your browser",
      title: "Cookie policy",
      description:
        "How LumiXplore uses cookies and other forms of browser storage.",
      sections: [
        {
          title: "1. What cookies are",
          paragraphs: [
            "Cookies are small pieces of data that a website can store in your browser and send to its server with certain requests.",
            "Local storage is a separate mechanism that remembers information in your browser, such as your language preference.",
          ],
        },
        {
          title: "2. Session and access",
          paragraphs: [
            "LumiXplore uses authentication-related cookies to recognize your session and provide access to account features.",
            "Blocking or deleting these cookies may sign you out or prevent some features from working.",
          ],
        },
        {
          title: "3. Language preference",
          paragraphs: [
            "The application saves your language choice in local storage under the key “lumixplore.language”.",
            "This remembers your selected language when you return using the same browser.",
          ],
        },
        {
          title: "4. Third-party services",
          paragraphs: [
            "Features such as Google sign-in or embedded trailers may communicate with external services.",
            "Their behavior and storage mechanisms depend on their configuration and their own policies.",
          ],
        },
        {
          title: "5. Managing browser storage",
          items: [
            "You can delete cookies and site data in your browser settings.",
            "Deleting local data may reset preferences stored in that browser.",
            "Deleting cookies does not by itself delete your account or information stored on the server.",
          ],
        },
        {
          title: "6. Inventory pending review",
          paragraphs: [
            "Before launch, this policy must include the actual cookie names, purposes, durations and providers.",
            "If analytics, advertising or other services are added, this information and the relevant preference controls must be reviewed.",
          ],
        },
      ],
    },
  },
};

interface LegalPageProps {
  page: LegalPageId;
}

function LegalPage({ page }: LegalPageProps) {
  const { i18n } = useTranslation();

  const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "es";
  const isSpanish = language === "es";
  const current = content[language][page];

  usePageTitle(current.title);

  const links = [
    {
      id: "terms",
      to: "/terms",
      label: isSpanish ? "Términos de uso" : "Terms of use",
    },
    {
      id: "privacy",
      to: "/privacy",
      label: isSpanish ? "Privacidad" : "Privacy",
    },
    {
      id: "cookies",
      to: "/cookies",
      label: isSpanish ? "Cookies" : "Cookies",
    },
  ];

  return (
    <main className="main-content legal-page">
      <div className="legal-page__inner">
        <header className="legal-page__intro">
          <span className="legal-page__eyebrow">{current.eyebrow}</span>

          <h1>{current.title}</h1>

          <p>{current.description}</p>
        </header>

        <nav
          className="legal-page__navigation"
          aria-label={isSpanish ? "Información del sitio" : "Site information"}
        >
          {links.map((link) => (
            <Link
              key={link.id}
              to={link.to}
              aria-current={page === link.id ? "page" : undefined}
              className={
                page === link.id
                  ? "legal-page__link is-active"
                  : "legal-page__link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <aside className="legal-page__notice">
          <span className="legal-page__notice-dot" aria-hidden="true" />

          <div>
            <h2>{isSpanish ? "Versión preliminar" : "Draft version"}</h2>

            <p>
              {isSpanish
                ? "Este contenido está en preparación y pendiente de revisión antes del lanzamiento público."
                : "This content is being prepared and must be reviewed before public launch."}
            </p>
          </div>
        </aside>

        <article className="legal-page__document" aria-label={current.title}>
          {current.sections.map((section) => (
            <section key={section.title} className="legal-page__section">
              <h2>{section.title}</h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <div className="legal-page__bottom">
          <span>LumiXplore</span>

          <Link to="/explore">
            {isSpanish ? "Volver a explorar" : "Back to explore"}
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export function TermsPage() {
  return <LegalPage page="terms" />;
}

export function PrivacyPage() {
  return <LegalPage page="privacy" />;
}

export function CookiesPage() {
  return <LegalPage page="cookies" />;
}
