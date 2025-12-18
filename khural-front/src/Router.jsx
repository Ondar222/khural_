import React from "react";

export function useHashRoute() {
  const [route, setRoute] = React.useState(
    () => window.location.hash.replace(/^#/, "") || "/"
  );
  React.useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.replace(/^#/, "") || "/");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (path) => {
    window.location.hash = path;
  };
  return { route, navigate };
}

export default function Router({ routes }) {
  const { route } = useHashRoute();
  const base = route.split("?")[0];
  const Component = routes[base] || routes["/"];
  React.useEffect(() => {
    // Always scroll to top on route change (desktop & mobile)
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [base]);
  return <Component />;
}
