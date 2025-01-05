import { createBrowserRouter } from "react-router-dom";

import App from "./App";
import Login from "./pages/Login";
import Main from "./pages/Main";
import PostRound from "./pages/PostRound";
import Register from "./pages/Register";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/main", element: <Main /> },
  { path: "/post-round", element: <PostRound /> },
]);
