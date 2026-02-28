import AppGemini from "./AppGemini";
import { GeminiKeyProvider } from "./contexts/GeminiKeyContext";
import PrintPreviewPage from "./pages/PrintPreviewPage";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";

const basePath = import.meta.env.VITE_BASE_PATH || '/';

const router = createBrowserRouter([
  { path: "/", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
  // 구주소(/paper/:id, /paper/:id/:view) 호환용 라우트
  { path: "/paper/:id", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
  { path: "/paper/:id/:view", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
  { path: "/print-preview", element: <PrintPreviewPage /> },
  { path: "/print-preview/memo", element: <PrintPreviewPage /> },
], {
  basename: basePath === '/' ? undefined : basePath.replace(/\/$/, ''),
});

export default function App() {
  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);