import React from "react";
import Header from "./components/Header.jsx";
import Router, { useHashRoute } from "./Router.jsx";
import Footer from "./components/Footer.jsx";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import DataProvider from "./context/DataContext.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import I18nProvider from "./context/I18nContext.jsx";
import A11yProvider from "./context/A11yContext.jsx";
import { Feedback, Press, Docs } from "./pages/TopbarStubs.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import AutomaticPageTranslator from "./components/AutomaticPageTranslator.jsx";
import { App as AntApp, ConfigProvider, theme } from "antd";

// Ленивая загрузка тяжёлых страниц: раньше все ~90 страниц попадали
// в один синхронный бандл, из-за чего Chrome мог «белить» на тяжёлых
// разделах (структура, комитеты, динамические страницы).
const lazy = (fn) => React.lazy(fn);

const Region = lazy(() => import("./pages/Region.jsx"));
const NewsArchive = lazy(() => import("./pages/NewsArchive.jsx"));
const Government = lazy(() => import("./pages/Government.jsx"));
const Authorities = lazy(() => import("./pages/Authorities.jsx"));
const Wifi = lazy(() => import("./pages/Wifi.jsx"));
const Committee = lazy(() => import("./pages/Committee.jsx"));
const CommitteeStaffDetail = lazy(() => import("./pages/CommitteeStaffDetail.jsx"));
const Contacts = lazy(() => import("./pages/Contacts.jsx"));
const ActivityPage = lazy(() => import("./pages/Activity.jsx"));
const CalendarPage = lazy(() => import("./pages/Calendar.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail.jsx"));
const Broadcast = lazy(() => import("./pages/Broadcast.jsx"));
const Deputies = lazy(() => import("./pages/DeputiesV2.jsx"));
const DebugPersons = lazy(() => import("./pages/DebugPersons.jsx"));
const DeputiesEnded = lazy(() => import("./pages/DeputiesEnded.jsx"));
const DeputiesHistoryRedirect = lazy(() => import("./pages/DeputiesHistoryRedirect.jsx"));
const PagesIndex = lazy(() => import("./pages/PagesIndex.jsx"));
const PageBySlug = lazy(() => import("./pages/PageBySlug.jsx"));
const Appeals = lazy(() => import("./pages/Appeals.jsx"));
const AppealsOnline = lazy(() => import("./pages/AppealsOnline.jsx"));
const AppealsLetter = lazy(() => import("./pages/AppealsLetter.jsx"));
const AppealsReview = lazy(() => import("./pages/AppealsReview.jsx"));
const AppealsComplaints = lazy(() => import("./pages/AppealsComplaints.jsx"));
const AppealsOverview = lazy(() => import("./pages/AppealsOverview.jsx"));
const AppealsPublicInterests = lazy(() => import("./pages/AppealsPublicInterests.jsx"));
const AppealsLegal = lazy(() => import("./pages/AppealsLegal.jsx"));
const AppealsSchedule = lazy(() => import("./pages/AppealsSchedule.jsx"));
const AppealsMinyust = lazy(() => import("./pages/AppealsMinyust.jsx"));
const MapPage = lazy(() => import("./pages/Map.jsx"));
const Apparatus = lazy(() => import("./pages/Apparatus.jsx"));
const SectionPage = lazy(() => import("./pages/Section.jsx"));
const Commission = lazy(() => import("./pages/Commission.jsx"));
const DocsPage = lazy(() => import("./pages/docs/DocsPage.jsx"));
const ActivitySectionPage = lazy(() => import("./pages/activity/ActivitySection.jsx"));
const BudgetDynamicPage = lazy(() => import("./pages/BudgetDynamicPage.jsx"));
const DistrictDetailPage = lazy(() => import("./pages/DistrictDetailPage.jsx"));
const PdPolicy = lazy(() => import("./pages/PdPolicy.jsx"));
const License = lazy(() => import("./pages/License.jsx"));
const Sitemap = lazy(() => import("./pages/Sitemap.jsx"));
const LegislativeMap = lazy(() => import("./pages/LegislativeMap.jsx"));
const NewsSliderDetail = lazy(() => import("./pages/NewsSliderDetail.jsx"));
const NewsWeekHighlights = lazy(() => import("./pages/NewsWeekHighlights.jsx"));
const SpeakerPowers = lazy(() => import("./pages/info/SpeakerPowers.jsx"));
const InfoContacts = lazy(() => import("./pages/info/Contacts.jsx"));
const ChildRights = lazy(() => import("./pages/info/ChildRights.jsx"));
const Symbols = lazy(() => import("./pages/info/Symbols.jsx"));
const CabinetHome = lazy(() => import("./pages/cabinet/CabinetHome.jsx"));
const CabinetAppeals = lazy(() => import("./pages/cabinet/CabinetAppeals.jsx"));
const CabinetAccount = lazy(() => import("./pages/cabinet/CabinetAccount.jsx"));
const YouthParliament = lazy(() => import("./pages/YouthParliament.jsx"));
const YouthParliamentRegulation = lazy(() => import("./pages/youth-parliament/Regulation.jsx"));
const YouthParliamentComposition = lazy(() => import("./pages/youth-parliament/Composition.jsx"));
const YouthParliamentReports = lazy(() => import("./pages/youth-parliament/Reports.jsx"));
const YouthParliamentReports2015 = lazy(() => import("./pages/youth-parliament/reports/2015.jsx"));
const YouthParliamentReports2016 = lazy(() => import("./pages/youth-parliament/reports/2016.jsx"));
const YouthParliamentReports2017 = lazy(() => import("./pages/youth-parliament/reports/2017.jsx"));
const YouthParliamentReports2018 = lazy(() => import("./pages/youth-parliament/reports/2018.jsx"));
const YouthParliamentReports2020 = lazy(() => import("./pages/youth-parliament/reports/2020.jsx"));
const YouthParliamentContacts = lazy(() => import("./pages/youth-parliament/Contacts.jsx"));
const YouthParliamentAgendas = lazy(() => import("./pages/youth-parliament/Agendas.jsx"));
const YouthParliamentDuzaProject = lazy(() => import("./pages/youth-parliament/DuzaProject.jsx"));
const YouthParliamentRules = lazy(() => import("./pages/youth-parliament/Rules.jsx"));

// Админ-панель грузится целиком лениво: она не нужна обычным посетителям.
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage.jsx"));
const AdminNewsPage = lazy(() => import("./pages/admin/AdminNewsPage.jsx"));
const AdminNewsCreatePage = lazy(() => import("./pages/admin/AdminNewsCreatePage.jsx"));
const AdminNewsEditPage = lazy(() => import("./pages/admin/AdminNewsEditPage.jsx"));
const AdminDeputiesPage = lazy(() => import("./pages/admin/AdminDeputiesPage.jsx"));
const AdminDeputiesCreatePage = lazy(() => import("./pages/admin/AdminDeputiesCreatePage.jsx"));
const AdminDeputiesEditPage = lazy(() => import("./pages/admin/AdminDeputiesEditPage.jsx"));
const AdminPagesV2Routes = lazy(() => import("./pages/admin/AdminPagesV2Routes.jsx"));
const AdminDocumentsPage = lazy(() => import("./pages/admin/AdminDocumentsPage.jsx"));
const AdminDocumentsCreatePage = lazy(() => import("./pages/admin/AdminDocumentsCreatePage.jsx"));
const AdminDocumentsEditPage = lazy(() => import("./pages/admin/AdminDocumentsEditPage.jsx"));
const AdminEventsPage = lazy(() => import("./pages/admin/AdminEventsPage.jsx"));
const AdminEventsCreatePage = lazy(() => import("./pages/admin/AdminEventsCreatePage.jsx"));
const AdminEventsEditPage = lazy(() => import("./pages/admin/AdminEventsEditPage.jsx"));
const AdminEnvDocsPage = lazy(() => import("./pages/admin/AdminEnvDocsPage.jsx"));
const AdminSliderPage = lazy(() => import("./pages/admin/AdminSliderPage.jsx"));
const AdminSliderCreatePage = lazy(() => import("./pages/admin/AdminSliderCreatePage.jsx"));
const AdminSliderEditPage = lazy(() => import("./pages/admin/AdminSliderEditPage.jsx"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage.jsx"));
const AdminBroadcastPage = lazy(() => import("./pages/admin/AdminBroadcastPage.jsx"));
const AdminConvocationsPage = lazy(() => import("./pages/admin/AdminConvocationsPage.jsx"));
const AdminConvocationsCreatePage = lazy(() => import("./pages/admin/AdminConvocationsCreatePage.jsx"));
const AdminConvocationsEditPage = lazy(() => import("./pages/admin/AdminConvocationsEditPage.jsx"));
const AdminConvocationsDocumentsPage = lazy(() => import("./pages/admin/AdminConvocationsDocumentsPage.jsx"));
const AdminConvocationsDocumentEditPage = lazy(() => import("./pages/admin/AdminConvocationsDocumentEditPage.jsx"));
const AdminCommitteesPage = lazy(() => import("./pages/admin/AdminCommitteesPage.jsx"));
const AdminCommitteesCreatePage = lazy(() => import("./pages/admin/AdminCommitteesCreatePage.jsx"));
const AdminCommitteesEditPage = lazy(() => import("./pages/admin/AdminCommitteesEditPage.jsx"));
const AdminCommitteeReportsPage = lazy(() => import("./pages/admin/AdminCommitteeReportsPage.jsx"));
const AdminCommissionsPage = lazy(() => import("./pages/admin/AdminCommissionsPage.jsx"));
const AdminCommissionsCreatePage = lazy(() => import("./pages/admin/AdminCommissionsCreatePage.jsx"));
const AdminCommissionsEditPage = lazy(() => import("./pages/admin/AdminCommissionsEditPage.jsx"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage.jsx"));
const AdminPortalsPage = lazy(() => import("./pages/admin/AdminPortalsPage.jsx"));

/** Редирект на панель управления (страница «Обращения» временно скрыта). */
function AdminRedirectToDashboard() {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/admin");
      window.dispatchEvent(new Event("app:navigate"));
    }
  }, []);
  return null;
}

function RouteFallback() {
  return (
    <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loading-spinner__icon" role="status" aria-label="Загрузка" />
    </div>
  );
}

export default function App() {
  const { route } = useHashRoute();
  const mainRef = React.useRef(null);
  const base = (route || "/").split("?")[0];
  const isAdmin = base === "/admin" || base.startsWith("/admin/");

  const AdminProtected = React.useCallback((Component) => {
    const ProtectedComponent = () => (
      <RequireAdmin>
        <Component />
      </RequireAdmin>
    );
    ProtectedComponent.displayName = `AdminProtected(${Component.displayName || Component.name || 'Component'})`;
    return ProtectedComponent;
  }, []);

  const UserProtected = React.useCallback((Component) => {
    const ProtectedComponent = () => (
      <RequireAuth>
        <Component />
      </RequireAuth>
    );
    ProtectedComponent.displayName = `UserProtected(${Component.displayName || Component.name || "Component"})`;
    return ProtectedComponent;
  }, []);

  /**
   * DataGate больше не блокирует рендеринг.
   * Данные загружаются асинхронно, компоненты показывают скелетоны.
   */
  const DataGate = ({ children }) => {
    return <>{children}</>;
  };

  return (
    <I18nProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#003366",
            colorInfo: "#003366",
            colorWarning: "#FFD700",
            colorTextBase: "#111827",
            colorBgBase: "#ffffff",
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <AuthProvider>
            <A11yProvider>
              <DataProvider>
                <DataGate>
                  <div className="layout">
                    {!isAdmin ? <Header /> : null}
                    <main className="main-content" ref={mainRef}>
                      <AutomaticPageTranslator rootRef={mainRef} enabled={!isAdmin} />
                      {!isAdmin ? <Breadcrumbs /> : null}
                      <AppErrorBoundary>
                        <React.Suspense fallback={<RouteFallback />}>
                          <Router
                            routes={{
                            "/": Home,
                            "/region": Region,
                            "/about": About,
                            "/news": NewsArchive,
                            "/news/week": NewsWeekHighlights,
                            "/news/slider/:id": NewsSliderDetail,
                            "/calendar": CalendarPage,
                            "/documents": Documents,
                            "/documents/:id": DocumentDetail,
                            "/broadcast": Broadcast,
                            "/docs/laws": DocsPage,
                            "/docs/resolutions": DocsPage,
                            "/docs/initiatives": DocsPage,
                            "/docs/civic": DocsPage,
                            "/docs/constitution": DocsPage,
                            "/docs/bills": DocsPage,
                            "/activity/plan": ActivitySectionPage,
                            "/activity/national-projects": ActivitySectionPage,
                            "/activity/reports": ActivitySectionPage,
                            "/activity/sessions": ActivitySectionPage,
                            "/activity/statistics": ActivitySectionPage,
                            "/activity/schet_palata": ActivitySectionPage,
                            "/committee": Committee,
                            "/committee/staff/:id": CommitteeStaffDetail,
                            "/commission": Commission,
                            "/apparatus": Apparatus,
                            "/section": SectionPage,
                            "/struct/:slug": PageBySlug,
                            "/info": PageBySlug,
                            // Главная страница избирательных округов
                            "/info/iokrug": PageBySlug,
                            // Динамические страницы бюджета (должны быть перед /info/:slug)
                            "/info/finansy/byudzhet/:slug": BudgetDynamicPage,
                            // Законодательная карта (должна быть перед /info/:slug)
                            "/info/zakon-karta": LegislativeMap,
                            // Динамические страницы избирательных округов (должны быть после /info/iokrug)
                            "/info/iokrug/:slug": DistrictDetailPage,
                            "/info/speaker-powers": SpeakerPowers,
                            "/info/polnomochiya-spikera": SpeakerPowers,
                            "/info/polnomochiya-speaker": SpeakerPowers,
                            "/info/contacts": InfoContacts,
                            "/info/child-rights": ChildRights,
                            "/info/upoln-po-reb": ChildRights,
                            "/info/symbols": Symbols,
                            "/info/gosudarstvennye-simvoly": Symbols,
                            "/info/border-subject": PageBySlug,
                            "/info/prigranichny-subekt": PageBySlug,
                            "/info/anti-corruption": PageBySlug,
                            "/info/protivodeystvie-korrupcii": PageBySlug,
                            "/about/finances": PageBySlug,
                            "/about/istoriya-parlamentarizma": PageBySlug,
                            "/about/polnomochiya": PageBySlug,
                            "/info/finansy": PageBySlug,
                            "/info/:slug": PageBySlug,
                            "/opendata": PageBySlug,
                            // "/convocations": Convocations, // Скрыто временно
                            "/deputies": Deputies,
                            "/deputies/ended": DeputiesEnded,
                            "/deputies/history/:convocationToken": DeputiesHistoryRedirect,
                            "/debug/persons": DebugPersons,
                            "/pages": PagesIndex,
                            "/p/:slug": PageBySlug,
                            "/code-of-honor": PageBySlug,
                            "/mothers-commandments": PageBySlug,
                            "/for-media": PageBySlug,
                            "/appeals": Appeals,
                            // Конкретные маршруты обращений (должны быть перед /appeals/:slug)
                            "/appeals/online": AppealsOnline,
                            "/appeals/letter": AppealsLetter,
                            "/appeals/review": AppealsReview,
                            "/appeals/complaints": AppealsComplaints,
                            "/appeals/overview": AppealsOverview,
                            "/appeals/public-interests": AppealsPublicInterests,
                            "/appeals/legal": AppealsLegal,
                            "/appeals/schedule": AppealsSchedule,
                            "/appeals/status": NotFound,
                            "/appeals/minyust": AppealsMinyust,
                            // Динамические маршруты для страниц разделов (должны быть после конкретных)
                            "/news/:slug": PageBySlug,
                            "/deputies/:slug": PageBySlug,
                            "/documents/:slug": PageBySlug,
                            "/docs/:slug": PageBySlug,
                            "/about/:slug": PageBySlug,
                            "/committees/:slug": PageBySlug,
                            "/committee/:slug": PageBySlug,
                            "/commissions/:slug": PageBySlug,
                            "/commission/:slug": PageBySlug,
                            "/activity/:slug": PageBySlug,
                            "/contacts/:slug": PageBySlug,
                            "/appeals/:slug": PageBySlug,
                            "/broadcast/:slug": PageBySlug,
                            "/government/:slug": PageBySlug,
                            "/apparatus/:slug": PageBySlug,
                            "/section/:slug": PageBySlug,
                            "/government": Government,
                            "/authorities": Authorities,
                            "/wifi": Wifi,
                            "/map": MapPage,
                            "/admin": AdminProtected(AdminDashboardPage),
                            "/admin/profile": AdminProtected(AdminProfilePage),
                            "/admin/news": AdminProtected(AdminNewsPage),
                            "/admin/news/create": AdminProtected(AdminNewsCreatePage),
                            "/admin/news/edit/:id": AdminProtected(AdminNewsEditPage),
                            "/admin/deputies": AdminProtected(AdminDeputiesPage),
                            "/admin/deputies/create": AdminProtected(AdminDeputiesCreatePage),
                            "/admin/deputies/edit/:id": AdminProtected(AdminDeputiesEditPage),
                            "/admin/pages": AdminProtected(AdminPagesV2Routes),
                            "/admin/pages/create": AdminProtected(AdminPagesV2Routes),
                            "/admin/pages/edit/:id": AdminProtected(AdminPagesV2Routes),
                            "/admin/documents": AdminProtected(AdminDocumentsPage),
                            "/admin/documents/create": AdminProtected(AdminDocumentsCreatePage),
                            "/admin/documents/:id": AdminProtected(AdminDocumentsEditPage),
                            "/admin/convocations": AdminProtected(AdminConvocationsPage),
                            "/admin/convocations/create": AdminProtected(AdminConvocationsCreatePage),
                            "/admin/convocations/edit/:id": AdminProtected(AdminConvocationsEditPage),
                            "/admin/convocations/documents": AdminProtected(AdminConvocationsDocumentsPage),
                            "/admin/convocations/documents/:convocationId/create": AdminProtected(AdminConvocationsDocumentEditPage),
                            "/admin/convocations/documents/:convocationId/edit/:documentId": AdminProtected(AdminConvocationsDocumentEditPage),
                            "/admin/committees": AdminProtected(AdminCommitteesPage),
                            "/admin/committees/create": AdminProtected(AdminCommitteesCreatePage),
                            "/admin/committees/edit/:id": AdminProtected(AdminCommitteesEditPage),
                            "/admin/committee-reports": AdminProtected(AdminCommitteeReportsPage),
                            "/admin/commissions": AdminProtected(AdminCommissionsPage),
                            "/admin/commissions/create": AdminProtected(AdminCommissionsCreatePage),
                            "/admin/commissions/edit/:id": AdminProtected(AdminCommissionsEditPage),
                            "/admin/portals": AdminProtected(AdminPortalsPage),
                            "/admin/events": AdminProtected(AdminEventsPage),
                            "/admin/events/create": AdminProtected(AdminEventsCreatePage),
                            "/admin/events/edit/:id": AdminProtected(AdminEventsEditPage),
                            "/admin/slider": AdminProtected(AdminSliderPage),
                            "/admin/slider/create": AdminProtected(AdminSliderCreatePage),
                            "/admin/slider/edit/:id": AdminProtected(AdminSliderEditPage),
                            "/admin/appeals": AdminProtected(AdminRedirectToDashboard),
                            "/admin/settings": AdminProtected(AdminSettingsPage),
                            "/admin/env": AdminProtected(AdminEnvDocsPage),
                            "/admin/broadcast": AdminProtected(AdminBroadcastPage),
                            "/feedback": Feedback,
                            "/press": Press,
                            "/activity": ActivityPage,
                            "/docs": Docs,
                            "/contacts": Contacts,
                            "/login": Login,
                            "/register": Register,
                            "/cabinet": UserProtected(CabinetHome),
                            "/cabinet/appeals": UserProtected(CabinetAppeals),
                            "/cabinet/account": UserProtected(CabinetAccount),
                            "/youth-parliament": YouthParliament,
                            "/youth-parliament/regulation": YouthParliamentRegulation,
                            "/youth-parliament/composition": YouthParliamentComposition,
                            "/youth-parliament/reports": YouthParliamentReports,
                            "/youth-parliament/reports/2015": YouthParliamentReports2015,
                            "/youth-parliament/reports/2016": YouthParliamentReports2016,
                            "/youth-parliament/reports/2017": YouthParliamentReports2017,
                            "/youth-parliament/reports/2018": YouthParliamentReports2018,
                            "/youth-parliament/reports/2020": YouthParliamentReports2020,
                            "/youth-parliament/contacts": YouthParliamentContacts,
                            "/youth-parliament/agendas": YouthParliamentAgendas,
                            "/youth-parliament/duza-project": YouthParliamentDuzaProject,
                            "/youth-parliament/rules": YouthParliamentRules,
                            "/youth-parliament/:slug": PageBySlug,
                            "/pd-policy": PdPolicy,
                            "/license": License,
                            "/sitemap": Sitemap,
                            "*": NotFound,
                          }}
                          />
                        </React.Suspense>
                      </AppErrorBoundary>
                    </main>
                    {!isAdmin ? <Footer /> : null}
                  </div>
                </DataGate>
              </DataProvider>
            </A11yProvider>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </I18nProvider>
  );
}