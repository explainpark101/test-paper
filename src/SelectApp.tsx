import { Link } from "react-router-dom";

export default function SelectApp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <h1 className="text-2xl font-semibold text-slate-800 mb-8">
        앱 선택
      </h1>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/gemini"
          className="px-8 py-4 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Gemini
        </Link>
        <Link
          to="/gpt"
          className="px-8 py-4 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          GPT
        </Link>
      </div>
    </div>
  );
}
