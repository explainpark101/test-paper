import { useEffect } from "react";
import AppGemini from "./AppGemini";
import { GeminiKeyProvider } from "./contexts/GeminiKeyContext";
import PrintPreviewPage from "./pages/PrintPreviewPage";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router";
import "./index.css";

const basePath = import.meta.env.VITE_BASE_PATH || '/';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
      { path: "paper/:id", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
      { path: "paper/:id/:view", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
      { path: "print-preview", element: <PrintPreviewPage /> },
      { path: "print-preview/memo", element: <PrintPreviewPage /> },
    ],
  },
], {
  basename: basePath === '/' ? undefined : basePath.replace(/\/$/, ''),
});

export default function App() {
  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);