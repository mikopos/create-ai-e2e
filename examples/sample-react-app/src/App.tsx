import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { RoutingProvider } from './routing/RoutingProvider';

// Dummy components
const Home = () => <div>Home Page</div>;
const About = () => <div>About Page</div>;
const Dashboard = () => <div>Dashboard</div>;
const Profile = () => <div>Profile</div>;
const AppLayout = () => (
  <div className="app-layout">
    <nav>
      <Link to="/app/dashboard">Dashboard</Link> | 
      <Link to="/app/settings">Settings</Link>
    </nav>
    <Outlet />
  </div>
);
const Settings = () => <div>Settings</div>;
const Admin = () => <div>Admin Panel</div>;
const UserLayout = () => <div>User Layout</div>;

// Example 1: Direct Route components
const DirectRoutes = () => (
  <Routes>
    {/* @tags public,main */}
    <Route path="/home" element={<Home />} />
    
    {/* @tags public,info */}
    <Route path="/about" element={<About />} />
  </Routes>
);

// Example 2: Route constants
const routeConfig = [
  // @tags private,dashboard
  { path: '/dashboard', element: <Dashboard /> },
  // @tags private,profile
  { path: '/profile', element: <Profile /> }
];

// Example 3: Nested routes
const nestedRoutes = [
  {
    path: '/app',
    element: <AppLayout />,
    // @tags private,main
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'settings', element: <Settings /> }
    ]
  }
];

// Example 4: Routes with metadata
const routesWithMeta = [
  {
    path: '/admin',
    element: <Admin />,
    // @tags private,admin
    meta: {
      requiresAuth: true,
      roles: ['admin']
    }
  }
];

// Example 5: Complex routing setup
const appRoutes = [
  // @tags public,main
  { path: '/', element: <Home /> },
  // @tags public,info
  { path: '/about', element: <About /> },
  // @tags private,admin
  { path: '/admin', element: <Admin /> },
  // @tags private,user
  { path: '/user/*', element: <UserLayout /> }
];

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/about">About</Link> | 
        <Link to="/dashboard">Dashboard</Link> | 
        <Link to="/profile">Profile</Link> | 
        <Link to="/app">App</Link> | 
        <Link to="/admin">Admin</Link>
      </nav>
      
      <RoutingProvider routes={appRoutes}>
        <DirectRoutes />
        
        {/* Using route constants */}
        <Routes>
          {routeConfig.map((route) => (
            <Route key={route.path} {...route} />
          ))}
        </Routes>

        {/* Using nested routes */}
        <Routes>
          {nestedRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element}>
              {route.children?.map((child) => (
                <Route key={child.path} {...child} />
              ))}
            </Route>
          ))}
        </Routes>

        {/* Using routes with metadata */}
        <Routes>
          {routesWithMeta.map((route) => (
            <Route key={route.path} {...route} />
          ))}
        </Routes>
      </RoutingProvider>
    </BrowserRouter>
  );
}
