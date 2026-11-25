import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";
import { PhotoAlbumApi } from "../api/client.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import SideNav from "../components/SideNav.jsx";

function useApiLang() {
  const { lang } = useI18n();
  return lang === "ty" || lang === "tyv" ? "tyv" : "ru";
}

function Breadcrumb({ items }) {
  return (
    <nav className="photo-breadcrumb" aria-label="Навигация">
      {items.map((item, index) => (
        <React.Fragment key={item.href || item.label}>
          {index > 0 && <span> / </span>}
          {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** Список фотоальбомов: /photo */
export function PhotoAlbumsPage() {
  const lang = useApiLang();
  const { t } = useI18n();
  const [albums, setAlbums] = React.useState([]);
  const [years, setYears] = React.useState([]);
  const [year, setYear] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    Promise.allSettled([PhotoAlbumApi.list({ lang }), PhotoAlbumApi.years()]).then(
      ([albumsResult, yearsResult]) => {
        if (!alive) return;
        if (albumsResult.status === "fulfilled") {
          setAlbums(Array.isArray(albumsResult.value) ? albumsResult.value : []);
        } else {
          setError(albumsResult.reason?.message || "Не удалось загрузить альбомы");
        }
        if (yearsResult.status === "fulfilled" && Array.isArray(yearsResult.value)) {
          setYears(yearsResult.value.filter((item) => {
            const y = Number(item);
            return Number.isFinite(y) && y >= 2024 && y <= 2026;
          }));
        }
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [lang]);

  const visible = React.useMemo(() => {
    const inRange = albums.filter((album) => {
      const y = Number(String(album.eventDate || "").slice(0, 4));
      return Number.isFinite(y) && y >= 2024 && y <= 2026;
    });
    return year ? inRange.filter((album) => String(album.eventDate || "").startsWith(year)) : inRange;
  }, [albums, year]);

  return (
    <main className="photo-page container">
      <Breadcrumb
        items={[
          { label: t("home"), href: "/" },
          { label: t("media") },
        ]}
      />
      <div className="photo-layout">
      <div className="photo-main">
      <h1>{t("media")}</h1>
      <p className="photo-page__intro">
        {lang === "tyv"
          ? "Хуралдың чурук альбомнары"
          : "Фотоальбомы Верховного Хурала Республики Тыва"}
      </p>

      {years.length > 0 && (
        <div className="photo-years">
          <button className={!year ? "is-active" : ""} onClick={() => setYear("")}>
            {t("allNews")}
          </button>
          {years.map((item) => (
            <button key={item} className={year === item ? "is-active" : ""} onClick={() => setYear(item)}>
              {item}
            </button>
          ))}
        </div>
      )}

      {error && <div className="photo-page__error">{error}</div>}
      {loading ? (
        <div className="photo-page__loading">Загрузка…</div>
      ) : visible.length ? (
        <div className="photo-albums-grid">
          {visible.map((album) => (
            <a className="photo-album-card" href={`/photo/${album.slug}`} key={album.id}>
              <div className="photo-album-card__cover">
                {album.coverUrl ? (
                  <img src={normalizeFilesUrl(album.coverUrl)} alt={album.title || ""} loading="lazy" />
                ) : (
                  <span>📷</span>
                )}
                {album.photosCount ? (
                  <span className="photo-album-card__count">{album.photosCount}</span>
                ) : null}
              </div>
              <div className="photo-album-card__title">{album.title}</div>
              {album.eventDate && (
                <div className="photo-album-card__date">
                  {new Date(album.eventDate).toLocaleDateString(lang === "tyv" ? "ru-RU" : "ru-RU")}
                </div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="photo-page__empty">Фотоальбомов пока нет</div>
      )}
      </div>
      <SideNav className="sidenav--card" />
      </div>
    </main>
  );
}

/** Страница одного альбома: /photo/:slug */
export function PhotoAlbumDetailPage() {
  const lang = useApiLang();
  const { route } = useHashRoute();
  const { t } = useI18n();
  const slug = React.useMemo(
    () => String(route || "").split("?")[0].replace(/^\/photo\//, "").replace(/\/$/, ""),
    [route],
  );
  const [album, setAlbum] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    PhotoAlbumApi.getBySlug(slug, lang)
      .then((data) => {
        if (alive) setAlbum(data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || "Альбом не найден");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug, lang]);

  return (
    <main className="photo-page container">
      <Breadcrumb
        items={[
          { label: t("home"), href: "/" },
          { label: t("media"), href: "/photo" },
          { label: album?.title || slug },
        ]}
      />
      <div className="photo-layout">
      <div className="photo-main">
      {loading ? (
        <div className="photo-page__loading">Загрузка…</div>
      ) : error ? (
        <div className="photo-page__error">{error}</div>
      ) : album ? (
        <>
          <h1>{album.title}</h1>
          {album.description && <p className="photo-page__intro">{album.description}</p>}
          {album.eventDate && (
            <div className="photo-page__date">
              {new Date(album.eventDate).toLocaleDateString("ru-RU")}
            </div>
          )}
          <div className="photo-gallery">
            {(album.photos || []).map((photo) => (
              <a className="photo-gallery__item" href={normalizeFilesUrl(photo.url)} target="_blank" rel="noreferrer" key={photo.id}>
                <img src={normalizeFilesUrl(photo.url)} alt={photo.caption || ""} loading="lazy" />
                {photo.caption && <span>{photo.caption}</span>}
              </a>
            ))}
          </div>
        </>
      ) : null}
      </div>
      <SideNav className="sidenav--card" />
      </div>
    </main>
  );
}

export default PhotoAlbumsPage;
