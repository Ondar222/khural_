import React from "react";
import DocumentActions from "../components/DocumentActions.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import { DocumentIcon, FolderIcon } from "../components/icons/LinearIcons.jsx";
import {
  CONV3_RESOLUTION,
  CONV3_COMMITTEES,
  getConv3DocsByCommittee,
} from "../data/committeeReportsConv3.js";
import { CONV4_COMMITTEES, getConv4DocsByCommittee } from "../data/committeeReportsConv4.js";

const CONVOCATION_REPORTS = {
  "Отчеты комитетов 3 созыва": {
    convocationLabel: "3 созыв",
    committees: CONV3_COMMITTEES,
    years: [2023, 2022, 2021, 2020, 2019],
    getDocs: getConv3DocsByCommittee,
    resolution: CONV3_RESOLUTION,
  },
  "Отчеты комитетов 4 созыва": {
    convocationLabel: "4 созыв",
    committees: CONV4_COMMITTEES,
    years: [2025, 2024],
    getDocs: getConv4DocsByCommittee,
    resolution: null,
  },
};

const CONVOCATION_CARDS = [
  {
    sectionTitle: "Отчеты комитетов 3 созыва",
    label: "Отчеты комитетов 3 созыва",
    hint: "2019–2023 годы",
  },
  {
    sectionTitle: "Отчеты комитетов 4 созыва",
    label: "Отчеты комитетов 4 созыва",
    hint: "2024–2025 годы",
  },
];

function BackButton({ href, children }) {
  return (
    <div className="cr-back">
      <a href={href} className="btn">
        ← {children}
      </a>
    </div>
  );
}

/** Расширение файла по ссылке — для бейджа типа документа */
function fileExt(url) {
  const m = String(url || "").match(/\.([a-z0-9]{2,5})(?:$|\?)/i);
  return m ? m[1].toUpperCase() : "DOC";
}

function DocumentRow({ doc, onPreview }) {
  const url = doc?.url || "";
  return (
    <li className="cr-doc">
      <div className="cr-doc__main">
        <span className="cr-doc__badge">{fileExt(url)}</span>
        <span className="cr-doc__title">{doc?.title || "Документ"}</span>
      </div>
      {url ? (
        <div className="cr-doc__actions">
          <DocumentActions
            url={url}
            title={doc?.title}
            openLabel="Открыть"
            onPreview={() => onPreview({ url, title: doc?.title })}
          />
        </div>
      ) : null}
    </li>
  );
}

function YearBlock({ year, docs, onPreview }) {
  return (
    <details className="cr-year" open={docs.length > 0}>
      <summary className="cr-year__summary">
        <span className="cr-year__label">{year} год</span>
        <span className="cr-year__count">
          {docs.length > 0 ? `${docs.length} док.` : "нет документов"}
        </span>
      </summary>
      {docs.length > 0 ? (
        <ul className="cr-docs">
          {docs.map((d, i) => (
            <DocumentRow key={`${year}-${i}`} doc={d} onPreview={onPreview} />
          ))}
        </ul>
      ) : (
        <div className="cr-year__empty">За этот год документы не опубликованы.</div>
      )}
    </details>
  );
}

function DocsSection({ heading, docs, years, onPreview }) {
  const hasAny = years.some((y) => (docs?.[y] || []).length > 0);
  return (
    <section className="cr-section">
      <h2 className="cr-section__title">{heading}</h2>
      {hasAny ? (
        <div className="cr-years">
          {years.map((y) => (
            <YearBlock key={y} year={y} docs={docs?.[y] || []} onPreview={onPreview} />
          ))}
        </div>
      ) : (
        <div className="cr-section__empty">Документы не опубликованы.</div>
      )}
    </section>
  );
}

function CommitteeView({ config, committeeIndex, onBackHref, onPreview }) {
  const { committees, years, getDocs, resolution, convocationLabel } = config;
  const committeeName = committees[committeeIndex];
  const { agendas, reports } = React.useMemo(
    () => (getDocs ? getDocs(committeeIndex) : { agendas: {}, reports: {} }),
    [getDocs, committeeIndex]
  );

  return (
    <div className="cr">
      <BackButton href={onBackHref}>Назад к списку комитетов</BackButton>
      <nav className="cr-breadcrumbs" aria-label="Навигация">
        <a href="/section?title=Отчеты%20комитетов">Отчеты комитетов</a>
        <span aria-hidden="true">/</span>
        <span>{convocationLabel}</span>
      </nav>
      <h1 className="no-gold-underline cr-title">{committeeName}</h1>
      <p className="cr-lead">
        Отчеты и повестки заседаний комитета Верховного Хурала (парламента) Республики Тыва.
      </p>

      <div className="cr-grid">
        <DocsSection heading="Повестки заседаний" docs={agendas} years={years} onPreview={onPreview} />
        <DocsSection heading="Отчеты" docs={reports} years={years} onPreview={onPreview} />
      </div>

      {resolution ? (
        <div className="cr-resolution">
          <div className="cr-resolution__label">Нормативный документ</div>
          <a className="cr-resolution__title" href={resolution.url} target="_blank" rel="noopener noreferrer">
            {resolution.title}
          </a>
          {resolution.size ? <span className="cr-resolution__size">{resolution.size}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function CommitteeListView({ config, baseHref }) {
  const { committees, convocationLabel } = config;
  return (
    <div className="cr">
      <BackButton href="/section?title=Отчеты%20комитетов">Назад</BackButton>
      <h1 className="no-gold-underline cr-title">Отчеты комитетов {convocationLabel}</h1>
      <p className="cr-lead">Выберите комитет, чтобы посмотреть повестки заседаний и отчеты по годам.</p>
      <div className="cr-cards">
        {committees.map((name, i) => (
          <a key={`${name}-${i}`} className="cr-card" href={`${baseHref}&committee=${i}`}>
            <span className="cr-card__icon" aria-hidden="true">
              <FolderIcon size={20} />
            </span>
            <span className="cr-card__name">{name}</span>
            <span className="cr-card__chevron" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ConvocationLanding() {
  return (
    <div className="cr">
      <BackButton href="/committee">Назад к комитетам</BackButton>
      <h1 className="no-gold-underline cr-title">Отчеты комитетов</h1>
      <p className="cr-lead">
        Отчеты о деятельности комитетов Верховного Хурала (парламента) Республики Тыва по созывам.
      </p>
      <div className="cr-cards cr-cards--convocations">
        {CONVOCATION_CARDS.map((item) => (
          <a
            key={item.sectionTitle}
            className="cr-card cr-card--convocation"
            href={`/section?title=${encodeURIComponent(item.sectionTitle)}`}
          >
            <span className="cr-card__icon" aria-hidden="true">
              <DocumentIcon size={22} />
            </span>
            <span className="cr-card__body">
              <span className="cr-card__name">{item.label}</span>
              <span className="cr-card__hint">{item.hint}</span>
            </span>
            <span className="cr-card__chevron" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Раздел «Отчеты комитетов» (лендинг + страницы 3 и 4 созывов).
 * title — значение query-параметра title; query — URLSearchParams текущего URL.
 */
export default function CommitteeReportsSection({ title, query }) {
  const [preview, setPreview] = React.useState(null);
  const onPreview = React.useCallback((doc) => setPreview(doc), []);

  let body = null;

  if (title === "Отчеты комитетов") {
    body = <ConvocationLanding />;
  } else {
    const config = CONVOCATION_REPORTS[title];
    if (config) {
      const baseHref = `/section?title=${encodeURIComponent(title)}`;
      const rawIndex = parseInt(query?.get("committee") ?? "", 10);
      const hasCommittee =
        Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < config.committees.length;
      body = hasCommittee ? (
        <CommitteeView
          config={config}
          committeeIndex={rawIndex}
          onBackHref={baseHref}
          onPreview={onPreview}
        />
      ) : (
        <CommitteeListView config={config} baseHref={baseHref} />
      );
    }
  }

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main" style={{ gridColumn: "1 / -1" }}>
            {body}
          </div>
        </div>
      </div>
      <PdfPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        url={preview?.url}
        title={preview?.title}
      />
    </section>
  );
}
