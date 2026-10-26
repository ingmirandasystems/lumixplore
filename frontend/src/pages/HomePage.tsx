import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import { PageShell } from "../layouts/PageShell";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import logo from "../assets/icons/lumixplore--logo.svg";
import "./HomePage.css";
import { Trans } from "react-i18next";
import arrowRight from "../assets/icons/arrow-right.svg";
import landPageHeroImage from "../assets/icons/land-page__img.png";
import happy from "../assets/icons/feliz-ligero.svg";
import sad from "../assets/icons/triste-emotivo.svg";
import mistery from "../assets/icons/misterioso.svg";
import intense from "../assets/icons/intenso.svg";
import fantasy from "../assets/icons/fantastico.svg";
import horror from "../assets/icons/terrorifico.svg";
import looking from "../assets/icons/01-cuentanos-que-buscas.svg";
import recommendations from "../assets/icons/02-recibe-recomendaciones.svg";
import watch from "../assets/icons/03-encuentra-donde-verla.svg";
import films from "../assets/icons/land-page__films.png";
import lumicard from "../assets/icons/land-lumicard__bg.png";
import favs from "../assets/icons/01-guarda-tu-lista.svg";
import sett from "../assets/icons/02-personaliza-preferencias.svg";
import news from "../assets/icons/03-region-y-plataformas.svg";
import platforms from "../assets/icons/04-historial.svg";
import filsMobile from "../assets/icons/land-films__mobile.png";
import { usePageTitle } from "../hooks/usePageTitle";

export function HomePage() {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  usePageTitle(t("home.pageTitle"));

  if (loading) {
    return <p>{t("session.checking")}</p>;
  }

  if (error) {
    return (
      <p role="alert">{t(getCommonErrorKey(error, "session.checkError"))}</p>
    );
  }

  if (user) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="home-page">
        <header className="home-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
            <Link to="/login" className="public-header__login">
              {t("common.login")}
            </Link>
            <Link to="/register" className="btn btn--register">
              {t("common.register")}
            </Link>
          </div>
        </header>
        <section className="home-hero">
          <div className="home-hero__text--container">
            <h2 className="hero--subtitle">{t("home.heroSubtitle")}</h2>
            <h1 className="hero--title">
              <Trans i18nKey="home.heroTitle" components={{ br: <br /> }} />
              <span>
                <Trans
                  i18nKey="home.heroTitleGradient"
                  components={{ br: <br /> }}
                />
              </span>
            </h1>
            <p className="hero--description">
              <Trans
                i18nKey="home.heroDescription"
                components={{ br: <br /> }}
              />
            </p>
            <div className="btns-group">
              <Link to="/login" className="btn btn-hero__explore">
                {t("home.heroExplore")}
                <img src={arrowRight} alt="" className="arrow-right" />
              </Link>
              <Link to="/register" className="btn btn-hero__create">
                {t("home.heroCreate")}
              </Link>
            </div>
            <span className="hero--accent">
              <Trans i18nKey="home.heroAccent" components={{ br: <br /> }} />
            </span>
          </div>
          <img src={landPageHeroImage} alt="" className="heroImage" />
        </section>
        <section className="home-recomendations">
          <h3 className="recommendation--title">
            {t("home.recommendationTitle")}
          </h3>
          <h4 className="recommendation--subtitle">
            {t("home.recommendationSubtitle")}
          </h4>
          <div className="recommendation-container">
            <div className="recommendation-happy">
              <img src={happy} alt="" className="recommendation-happy__icon" />
              <span>{t("home.recommendationHappy")}</span>
            </div>
            <div className="recommendation-sad">
              <img src={sad} alt="" className="recommendation-sad__icon" />
              <span>{t("home.recommendationSad")}</span>
            </div>
            <div className="recommendation-mistery">
              <img
                src={mistery}
                alt=""
                className="recommendation-mistery__icon"
              />
              <span>{t("home.recommendationMistery")}</span>
            </div>
            <div className="recommendation-intense">
              <img
                src={intense}
                alt=""
                className="recommendation-intense__icon"
              />
              <span>{t("home.recommendationIntense")}</span>
            </div>
            <div className="recommendation-fantasy">
              <img
                src={fantasy}
                alt=""
                className="recommendation-fantasy__icon"
              />
              <span>{t("home.recommendationFantasy")}</span>
            </div>
            <div className="recommendation-horror">
              <img
                src={horror}
                alt=""
                className="recommendation-horror__icon"
              />
              <span>{t("home.recommendationHorror")}</span>
            </div>
          </div>
        </section>
        <section className="home-steps">
          <h3 className="steps--title">{t("home.stepsTitle")}</h3>
          <h4 className="steps--subtitle">{t("home.stepsSubtitle")}</h4>
          <div className="steps-container">
            <div className="steps-looking">
              <img src={looking} alt="" className="steps-looking__icon" />
              <div>
                <span className="steps-looking__title">
                  {t("home.stepsLooking1")}
                </span>
                <span className="steps-looking__des">
                  {t("home.stepsLooking2")}
                </span>
              </div>
            </div>
            <div className="steps-recommendations">
              <img
                src={recommendations}
                alt=""
                className="steps-recommendations__icon"
              />
              <div>
                <span className="steps-recommendations__title">
                  {t("home.stepsRecommendations1")}
                </span>
                <span className="steps-recommendations__des">
                  {t("home.stepsRecommendations2")}
                </span>
              </div>
            </div>
            <div className="steps-watch">
              <img src={watch} alt="" className="steps-watch__icon" />
              <div>
                <span className="steps-watch__title">
                  {t("home.stepsWatch1")}
                </span>
                <span className="steps-watch__des">
                  {t("home.stepsWatch2")}
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="home-films">
          <h3 className="films--title">{t("home.filmsTitle")}</h3>
          <h4 className="films--subtitle">{t("home.filmsSubtitle")}</h4>
          <div className="films-container">
            <img src={films} alt="" className="home-films__img" />
            <img src={filsMobile} alt="" className="home-films__img--mobile" />
          </div>
        </section>

        <section className="home-lumicard">
          <div className="lumicard-container">
            <div className="lumicard-container--info">
              <div className="left-side__info">
                <div className="title--container">
                  <span>{t("home.lumicardTitle1")}</span>
                  <img src={logo} alt="" />
                  <span>{t("home.lumicardTitle2")}</span>
                </div>
                <p>
                  <Trans
                    i18nKey="home.lumicardDes"
                    components={{ br: <br /> }}
                  />
                </p>
                <div className="lumicard-options__icons">
                  <div className="option1">
                    <img src={favs} alt="" />
                    <span>{t("home.lumicardFavs")}</span>
                  </div>
                  <div className="option2">
                    <img src={sett} alt="" />
                    <span>{t("home.lumicardSett")}</span>
                  </div>
                  <div className="option3">
                    <img src={news} alt="" />
                    <span>{t("home.lumicardNews")}</span>
                  </div>
                  <div className="option4">
                    <img src={platforms} alt="" />
                    <span>{t("home.lumicardPlat")}</span>
                  </div>
                </div>
              </div>
              <div className="right-side__info">
                <Link to="/register" className="btn btn-lumicard__create">
                  {t("home.heroCreate")}
                  <img src={arrowRight} alt="" />
                </Link>
              </div>
            </div>
            <img src={lumicard} alt="" className="lumicard--bg" />
          </div>
        </section>

        <section className="home-encore">
          <h3 className="encore--title">{t("home.encoreTitle")}</h3>
          <h4 className="encore--subtitle">{t("home.encoreSub")}</h4>
          <Link to="/register" className="btn btn-encore__create">
            {t("home.heroCreate")}
            <img src={arrowRight} alt="" />
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
