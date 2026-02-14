// // main.jsx
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
import "./index.css";
export default function App() {
  return (
    <div>
      <AppGemini />
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);