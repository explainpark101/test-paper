import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Play, 
  Copy, 
  Trash2, 
  Home, 
  ChevronUp, 
  CheckCircle, 
  FileText, 
  Download,
  Upload,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

// --- IndexedDB Helper ---
const DB_NAME = 'ReactExamAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'papers';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
};

// --- View components (declared outside App to avoid re-creation on every render) ---
function HomeView({ papers, setView, setActivePaperId, newTitle, setNewTitle, onCreatePaper, onCopyPaper, onDeletePaper, onExportJSON, onImportJSON, importInputRef }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-500" /> 새 문제지 만들기
        </h2>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreatePaper()}
            placeholder="문제지 이름을 입력하고 Enter를 누르세요" 
            className="flex-1 border-b-2 border-gray-200 py-2 focus:border-indigo-500 outline-none transition-colors"
          />
          <button 
            onClick={onCreatePaper}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            생성
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> 내 문제지 목록
          </h2>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportJSON}
            />
            <button type="button" onClick={() => importInputRef.current?.click()} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
              <Upload className="w-3 h-3" /> JSON 가져오기
            </button>
            <button onClick={onExportJSON} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
              <Download className="w-3 h-3" /> JSON 추출
            </button>
          </div>
        </div>
        <div className="grid gap-4">
          {papers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">생성된 문제지가 없습니다.</div>
          ) : (
            papers.sort((a,b) => b.createdAt - a.createdAt).map(p => (
              <div key={p.id} className="group flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                <div>
                  <h3 className="font-bold text-gray-800">{p.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{p.subtitle || '기본 시험지'} | {p.questions.length}개 문항</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setActivePaperId(p.id); setView('exam'); }} className="p-2 text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-indigo-100">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => onCopyPaper(p.id)} className="p-2 text-gray-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeletePaper(p.id)} className="p-2 text-red-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ExamView({ activePaper, setView, onUpdateAnswer, onToggleType, focusNextInput }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{activePaper?.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{activePaper?.subtitle || '시험 모드'}</p>
        </div>
        <button 
          onClick={() => setView('score')}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100"
        >
          <CheckCircle className="w-4 h-4" /> 채점 모드 전환
        </button>
      </div>

      <div className="space-y-4">
        {activePaper?.questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Question <span className="text-2xl font-black text-indigo-500">{idx + 1}</span></span>
              <button 
                onClick={() => onToggleType(idx)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-indigo-500 transition-colors"
              >
                {q.type === 'input' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-indigo-500" />}
                {q.type === 'input' ? '서술형으로 전환' : '단답형으로 전환'}
              </button>
            </div>
            {q.type === 'input' ? (
              <input 
                className="q-input w-full border-b-2 border-gray-100 py-3 px-1 focus:border-indigo-500 outline-none transition-all text-lg"
                value={q.userAnswer}
                onChange={(e) => onUpdateAnswer(idx, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && focusNextInput(idx)}
                placeholder="답변을 입력하세요..."
              />
            ) : (
              <textarea 
                className="q-input w-full border-2 border-gray-100 rounded-xl p-4 focus:border-indigo-500 outline-none transition-all h-32 text-lg resize-none"
                value={q.userAnswer}
                onChange={(e) => onUpdateAnswer(idx, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && focusNextInput(idx)}
                placeholder="상세한 답변을 입력하세요 (Ctrl+Enter: 다음으로)..."
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreView({ activePaper, setView, onUpdateCorrectAnswer }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">채점: {activePaper?.title}</h2>
          <p className="text-sm text-gray-400 mt-1">좌측: 내 답변 | 우측: 실제 정답 입력</p>
        </div>
        <button 
          onClick={() => setView('exam')}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Play className="w-4 h-4" /> 시험 모드 복귀
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
        <div className="text-center font-bold text-gray-400 text-xs tracking-widest uppercase w-20 shrink-0">&nbsp;</div>
        <div className="text-center font-bold text-gray-400 text-xs tracking-widest uppercase">User Answer</div>
        <div className="text-center font-bold text-gray-400 text-xs tracking-widest uppercase">Correct Answer</div>
      </div>

      <div className="space-y-4">
        {activePaper?.questions.map((q, idx) => {
          if (q.userAnswer.trim() === '' && q.correctAnswer.trim() === '' && idx === activePaper.questions.length - 1) return null;
          const isDiff = q.correctAnswer.trim() !== '' && q.userAnswer.trim() !== q.correctAnswer.trim();

          return (
            <div key={q.id} className="grid grid-cols-[auto_1fr_1fr] gap-4 items-stretch">
              <div className="flex items-center justify-center w-20 shrink-0">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Question <span className="text-2xl font-black text-indigo-500">{idx + 1}</span></span>
              </div>
              <div className={`p-5 rounded-2xl text-sm whitespace-pre-wrap flex items-center transition-all ${isDiff ? 'bg-red-50 border-2 border-red-100 text-red-900 shadow-inner' : 'bg-gray-100 text-gray-600'}`}>
                {q.userAnswer || <span className="text-gray-300 italic">입력 없음</span>}
              </div>
              <textarea 
                className={`q-score-input w-full p-5 rounded-2xl border-2 outline-none text-sm transition-all min-h-[60px] resize-none ${isDiff ? 'border-red-400 bg-white text-red-600 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-green-500 bg-white'}`}
                value={q.correctAnswer}
                onChange={(e) => onUpdateCorrectAnswer(idx, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const next = document.querySelectorAll('.q-score-input')[idx + 1];
                    if (next) next.focus();
                  }
                }}
                placeholder="정답 입력 (Enter: 다음)..."
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [db, setDb] = useState(null);
  const [papers, setPapers] = useState([]);
  const [activePaperId, setActivePaperId] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'exam', 'score'
  const [newTitle, setNewTitle] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const refreshPapers = (database) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => setPapers(request.result);
  };
  
  // Load Initial Data
  useEffect(() => {
    initDB().then((database) => {
      setDb(database);
      refreshPapers(database);
    });

    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  

  const savePaperToDB = (paper) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(paper);
    request.onsuccess = () => refreshPapers(db);
  };

  const deletePaperFromDB = (id) => {
    if (!db || !confirm('정말 삭제하시겠습니까?')) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      refreshPapers(db);
      if (activePaperId === id) setView('home');
    };
  };

  const activePaper = papers.find(p => p.id === activePaperId);

  // --- Handlers ---
  const handleCreatePaper = () => {
    if (!newTitle.trim()) return;
    const newPaper = {
      title: newTitle.trim(),
      subtitle: '',
      createdAt: Date.now(),
      questions: [{ id: Date.now(), userAnswer: '', correctAnswer: '', type: 'input' }]
    };
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newPaper);
    request.onsuccess = (e) => {
      setNewTitle('');
      refreshPapers(db);
      setActivePaperId(e.target.result);
      setView('exam');
    };
  };

  const handleCopyPaper = (id) => {
    const original = papers.find(p => p.id === id);
    if (!original) return;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    const copy = {
      ...original,
      id: undefined,
      subtitle: `복사본 (${timeStr})`,
      createdAt: now.getTime()
    };
    savePaperToDB(copy);
  };

  const handleUpdateAnswer = (qIdx, val) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = { ...updatedPaper.questions[qIdx], userAnswer: val };

    // Auto-add next question if current is last and has content
    if (qIdx === updatedPaper.questions.length - 1 && val.trim() !== '') {
      updatedPaper.questions.push({
        id: Date.now(),
        userAnswer: '',
        correctAnswer: '',
        type: updatedPaper.questions[qIdx].type
      });
    }
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleUpdateCorrectAnswer = (qIdx, val) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = { ...updatedPaper.questions[qIdx], correctAnswer: val };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleToggleType = (qIdx) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = {
      ...updatedPaper.questions[qIdx],
      type: updatedPaper.questions[qIdx].type === 'input' ? 'textarea' : 'input'
    };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(papers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importInputRef = useRef(null);
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const list = Array.isArray(data) ? data : [data];
        const base = Date.now();
        const toAdd = [];
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          if (!p || typeof p.title !== 'string' || !Array.isArray(p.questions)) continue;
          const paper = {
            title: p.title,
            subtitle: p.subtitle ?? '',
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : base + i,
            questions: (p.questions || []).map((q, j) => ({
              id: base + i * 10000 + j,
              userAnswer: typeof q?.userAnswer === 'string' ? q.userAnswer : '',
              correctAnswer: typeof q?.correctAnswer === 'string' ? q.correctAnswer : '',
              type: q?.type === 'textarea' ? 'textarea' : 'input'
            }))
          };
          if (paper.questions.length === 0) paper.questions = [{ id: base + i * 10000, userAnswer: '', correctAnswer: '', type: 'input' }];
          toAdd.push(paper);
        }
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        toAdd.forEach((paper) => store.add(paper));
        transaction.oncomplete = () => refreshPapers(db);
      } catch (err) {
        alert('JSON 파일 형식이 올바르지 않습니다.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const focusNextInput = (idx) => {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.q-input');
      if (inputs[idx + 1]) inputs[idx + 1].focus();
    }, 10);
  };

  const currentView =
    view === 'home' ? (
      <HomeView
        papers={papers}
        setView={setView}
        setActivePaperId={setActivePaperId}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        onCreatePaper={handleCreatePaper}
        onCopyPaper={handleCopyPaper}
        onDeletePaper={deletePaperFromDB}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        importInputRef={importInputRef}
      />
    ) : view === 'exam' ? (
      <ExamView
        activePaper={activePaper}
        setView={setView}
        onUpdateAnswer={handleUpdateAnswer}
        onToggleType={handleToggleType}
        focusNextInput={focusNextInput}
      />
    ) : (
      <ScoreView
        activePaper={activePaper}
        setView={setView}
        onUpdateCorrectAnswer={handleUpdateCorrectAnswer}
      />
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex justify-between items-center">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 group"
          >
            <div className="p-2 bg-indigo-600 rounded-lg text-white group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ExamMaster</h1>
          </button>
          
          {view !== 'home' && (
            <button 
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Home className="w-4 h-4" /> 홈으로
            </button>
          )}
        </header>

        <main>
          {currentView}
        </main>
      </div>

      {/* Floating Buttons */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 left-8 p-4 bg-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}