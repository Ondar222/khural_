import React from "react";
import Header from "./components/Header.jsx";
import Router, { useHashRoute } from "./Router.jsx";
import Home from "./pages/Home.jsx";
import Region from "./pages/Region.jsx";
import NewsArchive from "./pages/NewsArchive.jsx";
import Government from "./pages/Government.jsx";
import Authorities from "./pages/Authorities.jsx";
import Wifi from "./pages/Wifi.jsx";
import Committee from "./pages/Committee.jsx";
import CommitteeStaffDetail from "./pages/CommitteeStaffDetail.jsx";
import { Feedback, Press, Docs } from "./pages/TopbarStubs.jsx";
import Contacts from "./pages/Contacts.jsx";
import ActivityPage from "./pages/Activity.jsx";
import Footer from "./components/Footer.jsx";
import DataProvider from "./context/DataContext.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import I18nProvider from "./context/I18nContext.jsx";
import A11yProvider from "./context/A11yContext.jsx";
import CalendarPage from "./pages/Calendar.jsx";
import About from "./pages/About.jsx";
import Documents from "./pages/Documents.jsx";
import DocumentDetail from "./pages/DocumentDetail.jsx";
import Broadcast from "./pages/Broadcast.jsx";
import Deputies from "./pages/DeputiesV2.jsx";
import DeputiesEnded from "./pages/DeputiesEnded.jsx";
import Convocations from "./pages/Convocations.jsx";
import PagesIndex from "./pages/PagesIndex.jsx";
import PageBySlug from "./pages/PageBySlug.jsx";
import Appeals from "./pages/Appeals.jsx";
import MapPage from "./pages/Map.jsx";
import { App as AntApp, ConfigProvider, theme } from "antd";
import CookieBanner from "./components/CookieBanner.jsx";
import Apparatus from "./pages/Apparatus.jsx";
import SectionPage from "./pages/Section.jsx";
import Commission from "./pages/Commission.jsx";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import DocsPage from "./pages/docs/DocsPage.jsx";
import ActivitySectionPage from "./pages/activity/ActivitySection.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import PdPolicy from "./pages/PdPolicy.jsx";
import License from "./pages/License.jsx";
import Sitemap from "./pages/Sitemap.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminNewsPage from "./pages/admin/AdminNewsPage.jsx";
import AdminNewsCreatePage from "./pages/admin/AdminNewsCreatePage.jsx";
import AdminNewsEditPage from "./pages/admin/AdminNewsEditPage.jsx";
import AdminDeputiesPage from "./pages/admin/AdminDeputiesPage.jsx";
import AdminDeputiesCreatePage from "./pages/admin/AdminDeputiesCreatePage.jsx";
import AdminDeputiesEditPage from "./pages/admin/AdminDeputiesEditPage.jsx";
import AdminPagesV2Routes from "./pages/admin/AdminPagesV2Routes.jsx";
import AdminDocumentsPage from "./pages/admin/AdminDocumentsPage.jsx";
import AdminDocumentsCreatePage from "./pages/admin/AdminDocumentsCreatePage.jsx";
import AdminDocumentsEditPage from "./pages/admin/AdminDocumentsEditPage.jsx";
import AdminEventsPage from "./pages/admin/AdminEventsPage.jsx";
import AdminEventsCreatePage from "./pages/admin/AdminEventsCreatePage.jsx";
import AdminEventsEditPage from "./pages/admin/AdminEventsEditPage.jsx";
import AdminAppealsPage from "./pages/admin/AdminAppealsPage.jsx";
import AdminEnvDocsPage from "./pages/admin/AdminEnvDocsPage.jsx";
import AdminSliderPage from "./pages/admin/AdminSliderPage.jsx";
import AdminSliderCreatePage from "./pages/admin/AdminSliderCreatePage.jsx";
import AdminSliderEditPage from "./pages/admin/AdminSliderEditPage.jsx";
import AdminProfilePage from "./pages/admin/AdminProfilePage.jsx";
import AdminBroadcastPage from "./pages/admin/AdminBroadcastPage.jsx";
import AdminConvocationsPage from "./pages/admin/AdminConvocationsPage.jsx";
import AdminConvocationsCreatePage from "./pages/admin/AdminConvocationsCreatePage.jsx";
import AdminConvocationsEditPage from "./pages/admin/AdminConvocationsEditPage.jsx";
import AdminConvocationsDocumentsPage from "./pages/admin/AdminConvocationsDocumentsPage.jsx";
import AdminConvocationsDocumentEditPage from "./pages/admin/AdminConvocationsDocumentEditPage.jsx";
import AdminCommitteesPage from "./pages/admin/AdminCommitteesPage.jsx";
import AdminCommitteesCreatePage from "./pages/admin/AdminCommitteesCreatePage.jsx";
import AdminCommitteesEditPage from "./pages/admin/AdminCommitteesEditPage.jsx";
import AdminPortalsPage from "./pages/admin/AdminPortalsPage.jsx";
import NewsSliderDetail from "./pages/NewsSliderDetail.jsx";
import NewsWeekHighlights from "./pages/NewsWeekHighlights.jsx";
import CabinetHome from "./pages/cabinet/CabinetHome.jsx";
import CabinetAppeals from "./pages/cabinet/CabinetAppeals.jsx";
import CabinetAccount from "./pages/cabinet/CabinetAccount.jsx";

export default function App() {
  const { route } = useHashRoute();
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
                <div className="layout">
                  {!isAdmin ? <Header /> : null}
                  <main className="main-content">
                    {!isAdmin ? <Breadcrumbs /> : null}
                    <AppErrorBoundary>
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
                          "/convocations": Convocations,
                          "/deputies": Deputies,
                          "/deputies/ended": DeputiesEnded,
                          "/pages": PagesIndex,
                          "/p/:slug": PageBySlug,
                          "/appeals": Appeals,
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
                          "/admin/portals": AdminProtected(AdminPortalsPage),
                          "/admin/events": AdminProtected(AdminEventsPage),
                          "/admin/events/create": AdminProtected(AdminEventsCreatePage),
                          "/admin/events/edit/:id": AdminProtected(AdminEventsEditPage),
                          "/admin/slider": AdminProtected(AdminSliderPage),
                          "/admin/slider/create": AdminProtected(AdminSliderCreatePage),
                          "/admin/slider/edit/:id": AdminProtected(AdminSliderEditPage),
                          "/admin/appeals": AdminProtected(AdminAppealsPage),
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
                          "/pd-policy": PdPolicy,
                          "/license": License,
                          "/sitemap": Sitemap,
                          "*": NotFound,
                        }}
                      />
                    </AppErrorBoundary>
                  </main>
                  {!isAdmin ? <Footer /> : null}
                  {!isAdmin ? <CookieBanner /> : null}
                </div>
              </DataProvider>
            </A11yProvider>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </I18nProvider>
  );
}
