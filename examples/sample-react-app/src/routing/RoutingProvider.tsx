import { Routes, Route } from 'react-router-dom';
import { ReactNode } from 'react';

interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  meta?: Record<string, any>;
}

interface RoutingProviderProps {
  routes: RouteConfig[];
  children?: ReactNode;
}

export const RoutingProvider: React.FC<RoutingProviderProps> = ({ routes, children }) => {
  const renderRoutes = (routeList: RouteConfig[]) => {
    return routeList.map((route) => (
      <Route key={route.path} path={route.path} element={route.element}>
        {route.children && renderRoutes(route.children)}
      </Route>
    ));
  };

  return (
    <>
      <Routes>{renderRoutes(routes)}</Routes>
      {children}
    </>
  );
}; 