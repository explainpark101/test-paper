
// import { createRoot } from "react-dom/client";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import AppGemini from "./AppGemini";
// import AppGPT from "./AppGPT";
// import SelectApp from "./SelectApp";
// import "./index.css";

// const router = createBrowserRouter([
//   { path: "/", element: <SelectApp /> },
//   { path: "/gemini", element: <AppGemini /> },
//   { path: "/gpt", element: <AppGPT /> },
// ]);

// export default function App() {
//   return <RouterProvider router={router} />;
// }

// const root = createRoot(document.getElementById("root"));
// root.render(<App />);

import AppGemini from "./AppGemini";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <AppGemini /> },
  // 구주소(/paper/:id, /paper/:id/:view) 호환용 라우트
  { path: "/paper/:id", element: <AppGemini /> },
  { path: "/paper/:id/:view", element: <AppGemini /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);