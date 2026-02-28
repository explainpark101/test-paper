import AppGemini from "./AppGemini";
import { GeminiKeyProvider } from "./contexts/GeminiKeyContext";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";

const basePath = import.meta.env.VITE_BASE_PATH || '/';

const router = createBrowserRouter([
  { path: "/", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
  // 구주소(/paper/:id, /paper/:id/:view) 호환용 라우트
  { path: "/paper/:id", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
  { path: "/paper/:id/:view", element: <GeminiKeyProvider><AppGemini /></GeminiKeyProvider> },
], {
  basename: basePath === '/' ? undefined : basePath.replace(/\/$/, ''),
});

export default function App() {
  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);