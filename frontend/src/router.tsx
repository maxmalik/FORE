import { createBrowserRouter } from "react-router-dom";

import App from "./App";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PostRound from "./pages/PostRound";
import Register from "./pages/Register";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/post-round", element: <PostRound /> },
]);
