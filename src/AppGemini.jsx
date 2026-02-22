import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  RotateCcw,
  Printer,
  Star,
  ChevronDown,
  Settings,
  CloudUpload,
  CloudDownload,
  Loader2
} from 'lucide-react';
import CloudflareKV from './utils/CloudflareKV';

import RangeSizeSelect from './components/RangeSizeSelect';
import PrintScoreView from './components/PrintScoreView';
import RadioToggle from './components/RadioToggle';
import ExamQuestionItem from './components/ExamQuestionItem';
import ScoreQuestionItem from './components/ScoreQuestionItem';
import ScoreFilterCheckboxes from './components/ScoreFilterCheckboxes';
import SelectDropdown from './components/SelectDropdown';
import ConfirmModal from './components/ConfirmModal';
import PromptModal from './components/PromptModal';
import HowToView from './components/HowToView';
import SettingsView from './components/SettingsView';
import Toast from './components/Toast';
import PasswordConfirmModal from './components/PasswordConfirmModal';
import { encryptMasterToken, decryptMasterToken } from './utils/masterTokenCrypto';

// Base path from environment variable
const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/';

// --- IndexedDB Helper ---
const DB_NAME = 'ReactExamAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'papers';

// Paper ID 생성: 브라우저에서 지원되면 crypto.randomUUID 사용, 아니면 fallback
const generatePaperId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `paper-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
};

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
function HomeView({ papers, setView, setActivePaperId, navigate, newTitle, setNewTitle, onCreatePaper, onCopyPaper, onDeletePaper, onExportJSON, onImportJSON, onCloudSave, onCloudLoad, cloudSaveLoading, cloudSaveSuccess, cloudLoadLoading, cloudLoadSuccess, importInputRef, copyModalOpen, copyModalPaperId, onOpenCopyModal, onCloseCopyModal, onConfirmCopy, deleteModalOpen, deleteModalPaperId, onOpenDeleteModal, onCloseDeleteModal, onConfirmDelete, folders, currentFolderKey, onSwitchFolder, cloudEnabled }) {
  // 각 문제지의 채점 결과를 계산하는 함수
  const calculateScoreStats = (paper) => {
    if (!paper || !paper.questions) {
      return { AO: 0, BO: 0, CO: 0, NO: 0, AX: 0, BX: 0, CX: 0, NX: 0, pending: 0, total: 0 };
    }

    let AO = 0, BO = 0, CO = 0, NO = 0;
    let AX = 0, BX = 0, CX = 0, NX = 0;
    let pending = 0;
    let total = 0;

    paper.questions.forEach((q) => {
      const hasCorrect = q.correctAnswer.trim() !== '';
      const hasUserAnswer = q.userAnswer.trim() !== '';
      
      // 둘 다 비어있으면 제외
      if (!hasCorrect && !hasUserAnswer) return;
      
      total++;
      
      if (!hasCorrect) {
        pending++;
        return;
      }

      const isCorrect = q.userAnswer.trim() === q.correctAnswer.trim();
      const selectedOption = q.selectedOption || null;

      if (isCorrect) {
        if (selectedOption === 'A') AO++;
        else if (selectedOption === 'B') BO++;
        else if (selectedOption === 'C') CO++;
        else NO++;
      } else {
        if (selectedOption === 'A') AX++;
        else if (selectedOption === 'B') BX++;
        else if (selectedOption === 'C') CX++;
        else NX++;
      }
    });

    return { AO, BO, CO, NO, AX, BX, CX, NX, pending, total };
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 새 문제지 만들기
        </h2>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreatePaper()}
            placeholder="문제지 이름을 입력하고 Enter를 누르세요" 
            className="flex-1 border-b-2 border-gray-200 dark:border-gray-600 py-2 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-colors bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button 
            onClick={onCreatePaper}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50"
          >
            생성
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
              <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 내 문제지 목록
            </h2>
            {cloudEnabled && folders?.keys?.length > 0 && (
              <SelectDropdown
                value={currentFolderKey}
                options={folders.keys.map((k) => ({ value: k, label: folders.aliases?.[k] ?? k }))}
                onChange={onSwitchFolder}
                disabled={cloudLoadLoading}
                placeholder="목록 선택"
                ariaLabel="문제지 목록 선택"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportJSON}
            />
            <button type="button" onClick={() => importInputRef.current?.click()} className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              <Upload className="w-3 h-3" /> JSON 가져오기
            </button>
            <button onClick={onExportJSON} className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              <Download className="w-3 h-3" /> JSON 추출
            </button>
            <button
              type="button"
              onClick={onCloudSave}
              disabled={cloudSaveLoading || cloudSaveSuccess}
              aria-busy={cloudSaveLoading}
              aria-label={cloudSaveLoading ? '저장 중' : cloudSaveSuccess ? '저장됨' : '클라우드 저장'}
              className={`text-xs flex items-center gap-1 shrink-0 ${cloudSaveLoading || cloudSaveSuccess ? 'opacity-70 cursor-not-allowed' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'}`}
            >
              {cloudSaveLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
              ) : cloudSaveSuccess ? (
                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <CloudUpload className="w-3 h-3" aria-hidden />
              )}
              {cloudSaveLoading ? '저장 중…' : cloudSaveSuccess ? '저장됨' : '클라우드 저장'}
            </button>
            <button
              type="button"
              onClick={onCloudLoad}
              disabled={cloudLoadLoading || cloudLoadSuccess}
              aria-busy={cloudLoadLoading}
              aria-label={cloudLoadLoading ? '불러오기 중' : cloudLoadSuccess ? '불러옴' : '클라우드 불러오기'}
              className={`text-xs flex items-center gap-1 shrink-0 ${cloudLoadLoading || cloudLoadSuccess ? 'opacity-70 cursor-not-allowed' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'}`}
            >
              {cloudLoadLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
              ) : cloudLoadSuccess ? (
                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <CloudDownload className="w-3 h-3" aria-hidden />
              )}
              {cloudLoadLoading ? '불러오기 중…' : cloudLoadSuccess ? '불러옴' : '클라우드 불러오기'}
            </button>
          </div>
        </div>
        <div className="grid gap-4">
          {papers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">생성된 문제지가 없습니다.</div>
          ) : (
            papers.sort((a,b) => b.createdAt - a.createdAt).map(p => {
              const createdDate = new Date(p.createdAt);
              const dateStr = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
              const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`;
              const stats = calculateScoreStats(p);
              const hasScore = stats.total > 0;
              return (
              <div key={p.id} className="group flex items-center justify-between p-5 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-all">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{p.title}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {p.subtitle && <span className="mr-2">{p.subtitle}</span>}
                    {dateStr} {timeStr} | {p.questions.length}개 문항
                  </p>
                  {hasScore && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-2">
                      {<span className="text-green-600 dark:text-green-400">AO {stats.AO}</span>}
                      {<span className="text-green-600 dark:text-green-400">BO {stats.BO}</span>}
                      {<span className="text-green-600 dark:text-green-400">CO {stats.CO}</span>}
                      {<span className="text-red-600 dark:text-red-400">AX {stats.AX}</span>}
                      {<span className="text-red-600 dark:text-red-400">BX {stats.BX}</span>}
                      {<span className="text-red-600 dark:text-red-400">CX {stats.CX}</span>}
                      {stats.NO > 0 && <span className="text-gray-500 dark:text-gray-400">NO {stats.NO}</span>}
                      {stats.NX > 0 && <span className="text-gray-500 dark:text-gray-400">NX {stats.NX}</span>}
                      {stats.pending > 0 && <span className="text-gray-400 dark:text-gray-500">미채점 {stats.pending}</span>}
                      {stats.total > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          총점 {((stats.AO + stats.BO + stats.CO + stats.NO) / stats.total * 100).toFixed(1)}점
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setActivePaperId(p.id); setView('exam'); navigate(`/?id=${p.id}&view=exam`); }} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => onOpenCopyModal(p.id)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onOpenDeleteModal(p.id)} className="p-2 text-red-500 dark:text-red-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Copy Modal */}
      <ConfirmModal
        isOpen={copyModalOpen}
        onClose={onCloseCopyModal}
        onConfirm={onConfirmCopy}
        title="문제지 복사"
        message={`"${papers.find(p => p.id === copyModalPaperId)?.title || ''}" 문제지를 복사하시겠습니까?`}
        confirmText="복사"
        cancelText="취소"
        type="default"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="문제지 삭제"
        message={`"${papers.find(p => p.id === deleteModalPaperId)?.title || ''}" 문제지를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />
    </div>
  );
}

function ExamView({ activePaper, setView, navigate, activePaperId, onUpdateAnswer, onToggleType, onToggleStar, focusNextInput, onUpdateSelectedOption, onUpdateTitle, onUpdateSubtitle, onSetAllUncheckedToA }) {
  // ABC가 체크되지 않고 input이 비어있지 않은 항목이 있는지 확인
  const hasUncheckedWithInput = activePaper?.questions.some(
    (q) => !q.selectedOption && q.userAnswer.trim() !== ''
  ) || false;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <input
            type="text"
            value={activePaper?.title || ''}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-transparent outline-none w-full focus:border-b-2 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
          />
          <input
            type="text"
            value={activePaper?.subtitle || ''}
            onChange={(e) => onUpdateSubtitle(e.target.value)}
            placeholder="소제목 입력 (선택사항)"
            className="text-sm text-gray-400 dark:text-gray-500 mt-1 bg-transparent border-transparent outline-none w-full focus:border-b-2 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {hasUncheckedWithInput && (
            <button 
              onClick={onSetAllUncheckedToA}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50 text-sm"
            >
              ABCON 입력안 한 거 전부 A로 체크
            </button>
          )}
          <button 
            onClick={() => { setView('score'); navigate(`/?id=${activePaperId}&view=score`); }}
            className="bg-green-600 dark:bg-green-700 cursor-pointer text-white px-5 py-2.5 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-100 dark:shadow-green-900/50"
          >
            <CheckCircle className="w-4 h-4" /> 채점 모드 전환
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activePaper?.questions.map((q, idx) => (
          <ExamQuestionItem
            key={q.id}
            question={q}
            index={idx}
            onUpdateAnswer={onUpdateAnswer}
            onToggleType={onToggleType}
            onToggleStar={onToggleStar}
            focusNextInput={focusNextInput}
            onUpdateSelectedOption={onUpdateSelectedOption}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreView({ activePaper, setView, navigate, activePaperId, onUpdateCorrectAnswer, onUpdateMemo, onResetAllCorrectAnswers, onToggleStar, onUpdateTitle, onUpdateSubtitle }) {
  const [rangeSize, setRangeSize] = useState(10);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filterChecks, setFilterChecks] = useState({
    AO: true,
    BO: true,
    CO: true,
    AX: true,
    BX: true,
    CX: true,
    NO: true,
    NX: true
  });

  // 마지막부터 연속으로 둘 다 비어 있는 문항은 채점 대상에서 제외
  const effectiveQuestions = React.useMemo(() => {
    const list = activePaper?.questions ?? [];
    let end = 0;
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      if (q.userAnswer.trim() !== '' || q.correctAnswer.trim() !== '') {
        end = i + 1;
      }
    }
    return list.slice(0, end);
  }, [activePaper?.questions]);

  // 각 문항의 상태를 결정하는 헬퍼 함수
  const getQuestionState = React.useCallback((q) => {
    const hasCorrect = q.correctAnswer.trim() !== '';
    if (!hasCorrect) return null; // 미채점
    
    const isCorrect = q.userAnswer.trim() === q.correctAnswer.trim();
    const selectedOption = q.selectedOption || null;
    
    if (isCorrect) {
      if (selectedOption === 'A') return 'AO';
      if (selectedOption === 'B') return 'BO';
      if (selectedOption === 'C') return 'CO';
      return 'NO';
    } else {
      if (selectedOption === 'A') return 'AX';
      if (selectedOption === 'B') return 'BX';
      if (selectedOption === 'C') return 'CX';
      return 'NX';
    }
  }, []);

  const visibleQuestions = React.useMemo(() => {
    if (!effectiveQuestions.length) return [];
    
    let filtered = effectiveQuestions.map((q, idx) => ({ question: q, originalIndex: idx }));
    
    // 별표 필터링
    if (showOnlyStarred) {
      filtered = filtered.filter((item) => item.question.starred);
    }
    
    // ABC 선택 필터링
    const allChecked = Object.values(filterChecks).every(v => v === true);
    if (!allChecked) {
      filtered = filtered.filter((item) => {
        const state = getQuestionState(item.question);
        if (state === null) return true; // 미채점 항목은 항상 표시
        return filterChecks[state] === true;
      });
    }
    
    return filtered;
  }, [effectiveQuestions, showOnlyStarred, filterChecks, getQuestionState]);

  const stats = React.useMemo(() => {
    if (!visibleQuestions.length) {
      return { 
        total: 0, correct: 0, wrong: 0, pending: 0,
        AX: 0, BX: 0, CX: 0, AO: 0, BO: 0, CO: 0, NO: 0, NX: 0
      };
    }
    let correct = 0, wrong = 0, pending = 0;
    let AX = 0, BX = 0, CX = 0, AO = 0, BO = 0, CO = 0, NO = 0, NX = 0;
    
    visibleQuestions.forEach((item) => {
      const q = item.question;
      const hasCorrect = q.correctAnswer.trim() !== '';
      const isCorrect = hasCorrect && q.userAnswer.trim() === q.correctAnswer.trim();
      const isWrong = hasCorrect && q.userAnswer.trim() !== q.correctAnswer.trim();
      const selectedOption = q.selectedOption || null;
      
      if (!hasCorrect) {
        pending += 1;
      } else if (isCorrect) {
        correct += 1;
        if (selectedOption === 'A') AO += 1;
        else if (selectedOption === 'B') BO += 1;
        else if (selectedOption === 'C') CO += 1;
        else NO += 1;
      } else {
        wrong += 1;
        if (selectedOption === 'A') AX += 1;
        else if (selectedOption === 'B') BX += 1;
        else if (selectedOption === 'C') CX += 1;
        else NX += 1;
      }
    });
    
    return { 
      total: visibleQuestions.length, 
      correct, 
      wrong, 
      pending,
      AX, BX, CX, AO, BO, CO, NO, NX
    };
  }, [visibleQuestions]);

  const rangeStats = React.useMemo(() => {
    if (!visibleQuestions.length || !rangeSize || rangeSize < 1) return [];
    const size = rangeSize;
    const list = visibleQuestions;
    const result = [];
    for (let start = 0; start < list.length; start += size) {
      const end = Math.min(start + size, list.length);
      let correct = 0, wrong = 0, pending = 0;
      let AX = 0, BX = 0, CX = 0, AO = 0, BO = 0, CO = 0, NO = 0, NX = 0;
      for (let i = start; i < end; i++) {
        const item = list[i];
        const q = item.question;
        const state = getQuestionState(q);
        const hasCorrect = q.correctAnswer.trim() !== '';
        if (!hasCorrect) {
          pending += 1;
        } else if (q.userAnswer.trim() === q.correctAnswer.trim()) {
          correct += 1;
          if (state === 'AO') AO += 1;
          else if (state === 'BO') BO += 1;
          else if (state === 'CO') CO += 1;
          else if (state === 'NO') NO += 1;
        } else {
          wrong += 1;
          if (state === 'AX') AX += 1;
          else if (state === 'BX') BX += 1;
          else if (state === 'CX') CX += 1;
          else if (state === 'NX') NX += 1;
        }
      }
      result.push({ start: start + 1, end, correct, wrong, pending, AX, BX, CX, AO, BO, CO, NO, NX });
    }
    return result;
  }, [visibleQuestions, rangeSize, getQuestionState]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">채점:</span>
            <input
              type="text"
              value={activePaper?.title || ''}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-transparent outline-none flex-1 focus:border-b-2 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>
          <input
            type="text"
            value={activePaper?.subtitle || ''}
            onChange={(e) => onUpdateSubtitle(e.target.value)}
            placeholder="소제목 입력 (선택사항)"
            className="text-sm text-gray-400 dark:text-gray-500 mt-1 bg-transparent border-transparent outline-none w-full focus:border-b-2 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          />
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">좌측: 내 답변 | 우측: 실제 정답 입력</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPrintView(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-5 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> 인쇄 미리보기
          </button>
          <button 
            onClick={() => { setView('exam'); navigate(`/?id=${activePaperId}&view=exam`); }}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50"
          >
            <Play className="w-4 h-4" /> 시험 모드 복귀
          </button>
        </div>
      </div>

      {showPrintView && (
        <PrintScoreView
          title={activePaper?.title ?? ''}
          questions={effectiveQuestions}
          onClose={() => setShowPrintView(false)}
        />
      )}

      <details 
        className="sticky top-0 z-10 py-3 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3"
        open={isDetailsOpen}
        onToggle={(e) => setIsDetailsOpen(e.target.open)}
      >
        <summary className="group relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm cursor-pointer">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            총 <span className="text-indigo-600 dark:text-indigo-400">{stats.total}</span>개 중
          </span>
          <span className="text-green-600 dark:text-green-400 font-semibold">맞음 {stats.correct}개</span>
          <span className="text-red-500 dark:text-red-400 font-semibold">틀림 {stats.wrong}개</span>
          <span className="text-gray-400 dark:text-gray-500 font-medium">미채점 {stats.pending}개</span>
          <span className="text-green-600 dark:text-green-400 font-medium">총점 {(stats.correct / stats.total * 100).toFixed(2)}점</span>
          
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            {isDetailsOpen ? '눌러서 접기' : '눌러서 상세보기'}
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
          </div>
        </summary>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs border-t border-gray-100 dark:border-gray-700 pt-3">
          <span className="font-semibold text-gray-600 dark:text-gray-400">ABCon:</span>
          <span className="text-green-600 dark:text-green-400">AO {stats.AO}</span>
          <span className="text-green-600 dark:text-green-400">BO {stats.BO}</span>
          <span className="text-green-600 dark:text-green-400">CO {stats.CO}</span>
          <span className="text-red-600 dark:text-red-400">AX {stats.AX}</span>
          <span className="text-red-600 dark:text-red-400">BX {stats.BX}</span>
          <span className="text-red-600 dark:text-red-400">CX {stats.CX}</span>
          <span className="text-gray-400 dark:text-gray-500">NO {stats.NO}</span>
          <span className="text-gray-400 dark:text-gray-500">NX {stats.NX}</span>
        </div>
        <ScoreFilterCheckboxes 
          filterChecks={filterChecks}
          onChange={setFilterChecks}
        />
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <button
            type="button"
            onClick={() => setShowOnlyStarred((prev) => !prev)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              showOnlyStarred
                ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:border-yellow-300 dark:hover:border-yellow-600 hover:text-yellow-600 dark:hover:text-yellow-400'
            }`}
          >
            <Star className={`w-3 h-3 ${showOnlyStarred ? 'fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500' : 'text-yellow-400 dark:text-yellow-500'}`} />
            <span>별표 문항만 보기</span>
          </button>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">문항 구간별:</span>
          <RangeSizeSelect
            value={rangeSize}
            onChange={setRangeSize}
            max={visibleQuestions.length || 9999}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            {rangeStats.map((r) => (
              <span key={`${r.start}-${r.end}`} className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{r.start}~{r.end}번</span>
                {' '}
                <span className="text-green-600 dark:text-green-400">✓{r.correct}</span>
                <span className="text-red-500 dark:text-red-400"> ✗{r.wrong}</span>
                {r.pending > 0 && <span className="text-gray-400 dark:text-gray-500"> 미{r.pending}</span>}
                <span className="text-green-500 dark:text-green-400"> {(r.correct / (r.correct + r.wrong) * 100).toFixed(2)}점</span>
                {' '}
                {<div className='flex gap-1.5'>
                  {<span className="text-green-600 dark:text-green-400">AO {r.AO}</span>}
                  {<span className="text-green-600 dark:text-green-400">BO {r.BO}</span>}
                  {<span className="text-green-600 dark:text-green-400">CO {r.CO}</span>}
                  {<span className="text-red-600 dark:text-red-400">AX {r.AX}</span>}
                  {<span className="text-red-600 dark:text-red-400">BX {r.BX}</span>}
                  {<span className="text-red-600 dark:text-red-400">CX {r.CX}</span>}  
                </div>}
                {
                  r.NO + r.NX > 0 &&
                  <div className='flex gap-1.5'>
                    {r.NO > 0 && <span className="text-gray-400 dark:text-gray-500">NO{r.NO}</span>}
                    {r.NX > 0 && <span className="text-gray-400 dark:text-gray-500">NX{r.NX}</span>}
                  </div>
                }
              </span>
            ))}
          </div>
        </div>
      </details>

      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 items-center">
        <div className="text-center font-bold text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase w-20 shrink-0">&nbsp;</div>
        <div className="text-center font-bold text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase">User Answer</div>
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase">Correct Answer</span>
          <button
            type="button"
            onClick={onResetAllCorrectAnswers}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Correct Answer 전체 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </button>
        </div>
        <div className="text-center font-bold text-gray-400 dark:text-gray-500 text-xs tracking-widest uppercase">Memo</div>
      </div>

      <div className="space-y-4">
        {visibleQuestions.map((item, idx) => {
          const q = item.question;
          const originalIndex = item.originalIndex;
          const displayNumber = originalIndex + 1;
          const isDiff = q.correctAnswer.trim() !== '' && q.userAnswer.trim() !== q.correctAnswer.trim();
          const questionState = getQuestionState(q);

          return (
            <ScoreQuestionItem
              key={q.id}
              question={q}
              displayNumber={displayNumber}
              originalIndex={originalIndex}
              isDiff={isDiff}
              questionState={questionState}
              onUpdateCorrectAnswer={onUpdateCorrectAnswer}
              onUpdateMemo={onUpdateMemo}
              onToggleStar={onToggleStar}
              scoreInputIndex={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

const CLOUD_WORKER_URL_KEY = 'exam_cloud_worker_url';
const CLOUD_MASTER_TOKEN_KEY = 'exam_cloud_master_token';
const CLOUD_MASTER_TOKEN_ENCRYPTED_KEY = 'exam_cloud_master_token_encrypted';
const FOLDERS_KV_KEY = 'folders';
const CURRENT_FOLDER_KEY = 'exam_current_folder_key';
const DEFAULT_PAPER_LIST_KEY = 'papers';
const DEFAULT_PAPER_LIST_ALIAS = '기본 문제지';

export default function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const urlPaperId = searchParams.get('id');
  const urlView = searchParams.get('view');
  const [db, setDb] = useState(null);
  const [papers, setPapers] = useState([]);
  const [activePaperId, setActivePaperId] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'exam', 'score', 'settings'
  const [newTitle, setNewTitle] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyModalPaperId, setCopyModalPaperId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalPaperId, setDeleteModalPaperId] = useState(null);
  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [deleteFolderKey, setDeleteFolderKey] = useState(null);
  const [addFolderModalOpen, setAddFolderModalOpen] = useState(false);
  const [cloudWorkerUrl, setCloudWorkerUrl] = useState(() => typeof localStorage !== 'undefined' ? (localStorage.getItem(CLOUD_WORKER_URL_KEY) || '') : '');
  const [cloudMasterToken, setCloudMasterToken] = useState(() => {
    if (typeof sessionStorage === 'undefined') return '';
    return sessionStorage.getItem(CLOUD_MASTER_TOKEN_KEY) || '';
  });
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSavePasswordModal, setShowSavePasswordModal] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [importFileContent, setImportFileContent] = useState(null);
  const [importError, setImportError] = useState('');
  const cloudBackupFileInputRef = useRef(null);
  const [cloudSaveLoading, setCloudSaveLoading] = useState(false);
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState(false);
  const [cloudLoadLoading, setCloudLoadLoading] = useState(false);
  const [cloudLoadSuccess, setCloudLoadSuccess] = useState(false);
  const [folders, setFolders] = useState({ keys: [DEFAULT_PAPER_LIST_KEY], aliases: { [DEFAULT_PAPER_LIST_KEY]: DEFAULT_PAPER_LIST_ALIAS } });
  const [currentFolderKey, setCurrentFolderKeyState] = useState(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_PAPER_LIST_KEY;
    return localStorage.getItem(CURRENT_FOLDER_KEY) || DEFAULT_PAPER_LIST_KEY;
  });

  const setCurrentFolderKey = (key) => {
    setCurrentFolderKeyState(key);
    if (typeof localStorage !== 'undefined') localStorage.setItem(CURRENT_FOLDER_KEY, key);
  };

  const CLOUD_BUTTON_SUCCESS_MS = 3000;

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

  // 클라우드 활성 시 folders KV 로드 및 현재 문제지목록 키로 불러오기
  useEffect(() => {
    if (!db || !getCloudKV()) return;
    if (hasAutoLoadedCloudRef.current) return;
    hasAutoLoadedCloudRef.current = true;
    skipNextDebounceRef.current = true;
    const kv = getCloudKV();
    const defaultFolders = { keys: [DEFAULT_PAPER_LIST_KEY], aliases: { [DEFAULT_PAPER_LIST_KEY]: DEFAULT_PAPER_LIST_ALIAS } };
    kv.readData(FOLDERS_KV_KEY)
      .then((data) => {
        if (data && Array.isArray(data.keys) && data.keys.length > 0 && data.aliases && typeof data.aliases === 'object') {
          setFolders({ keys: data.keys, aliases: data.aliases });
          return { keys: data.keys, aliases: data.aliases };
        }
        return kv.updateData(FOLDERS_KV_KEY, defaultFolders).then(() => {
          setFolders(defaultFolders);
          return defaultFolders;
        });
      })
      .catch(() => kv.updateData(FOLDERS_KV_KEY, defaultFolders).then(() => {
        setFolders(defaultFolders);
        return defaultFolders;
      }))
      .then((foldersData) => {
        if (!foldersData || !foldersData.keys || foldersData.keys.length === 0) return;
        const keyToLoad = foldersData.keys.includes(currentFolderKey) ? currentFolderKey : foldersData.keys[0];
        if (!foldersData.keys.includes(currentFolderKey)) setCurrentFolderKey(foldersData.keys[0]);
        return kv.readData(keyToLoad).then((record) => mergeCloudIntoLocal(record));
      })
      .then(() => {
        skipNextDebounceRef.current = true;
        addToast('클라우드에서 불러왔습니다.');
      })
      .catch(() => {});
  }, [db, cloudWorkerUrl, cloudMasterToken]);

  useEffect(() => {
    if (!cloudSaveSuccess) return;
    const t = setTimeout(() => setCloudSaveSuccess(false), CLOUD_BUTTON_SUCCESS_MS);
    return () => clearTimeout(t);
  }, [cloudSaveSuccess]);

  useEffect(() => {
    if (!cloudLoadSuccess) return;
    const t = setTimeout(() => setCloudLoadSuccess(false), CLOUD_BUTTON_SUCCESS_MS);
    return () => clearTimeout(t);
  }, [cloudLoadSuccess]);

  // 로컬 변경 후 5초 디바운스 뒤 자동 클라우드 저장
  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const kv = getCloudKV();
    if (!kv) return;
    if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
    setDebounceKey(Date.now());
    setDebouncePending(true);
    debounceSaveTimerRef.current = setTimeout(() => {
      debounceSaveTimerRef.current = null;
      setDebouncePending(false);
      const toSave = papersRef.current;
      kv.updateData(currentFolderKey, toSave).then(() => addToast('클라우드에 저장되었습니다.')).catch(() => {});
    }, 5000);
    return () => {
      if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
      setDebouncePending(false);
    };
  }, [papers]);

  // Ctrl+S / Cmd+S: 디바운스 취소 후 즉시 클라우드 저장
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (debounceSaveTimerRef.current) {
          clearTimeout(debounceSaveTimerRef.current);
          debounceSaveTimerRef.current = null;
          setDebouncePending(false);
        }
        const kv = getCloudKV();
        if (!kv) return;
        const toSave = papersRef.current;
        kv.updateData(currentFolderKey, toSave).then(() => addToast('클라우드에 저장되었습니다.')).catch(() => {});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cloudWorkerUrl, cloudMasterToken]);

  // 기존 /paper/:id(/:view) 주소로 들어온 경우, search parameter 형식으로 리다이렉트
  useEffect(() => {
    // React Router의 basename이 이미 제거된 경로를 반환하므로, 그대로 사용
    const path = location.pathname || '';
    if (!path.startsWith('/paper/')) return;

    const segments = path.split('/').filter(Boolean); // ["paper", "{id}", "{view?}"]
    if (segments[0] !== 'paper' || !segments[1]) return;

    const legacyId = segments[1];
    const legacyView = segments[2] === 'score' ? 'score' : 'exam';

    navigate(`/?id=${legacyId}&view=${legacyView}`, { replace: true });
  }, [location.pathname, navigate]);

  // URL에서 문제지 ID와 view 읽어서 자동 로드 (URL 변경 시에만)
  useEffect(() => {
    if (urlView === 'settings') {
      setView('settings');
      setActivePaperId(null);
      return;
    }
    if (urlView === 'howto') {
      setView('howto');
      setActivePaperId(null);
      return;
    }
    if (!papers.length) return;

    if (urlPaperId) {
      const paper = papers.find(p => p.id === urlPaperId);
      if (paper) {
        if (paper.id !== activePaperId) {
          setActivePaperId(paper.id);
        }
        const targetView = urlView && ['exam', 'score'].includes(urlView) ? urlView : 'exam';
        if (targetView !== view) {
          setView(targetView);
        }
      } else {
        // URL에 있는 ID가 존재하지 않으면 홈으로
        if (activePaperId || view !== 'home') {
          setActivePaperId(null);
          setView('home');
          navigate('/?', { replace: true });
        }
      }
    } else {
      // URL에 ID가 없으면 홈으로
      if (activePaperId || view !== 'home') {
        setActivePaperId(null);
        setView('home');
      }
    }
  }, [papers, urlPaperId, urlView]); // activePaperId와 view는 의존성에서 제외하여 무한 루프 방지

  

  const savePaperToDB = (paper) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(paper);
    request.onsuccess = () => refreshPapers(db);
  };

  const deletePaperFromDB = (id) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      refreshPapers(db);
      if (activePaperId === id) {
        setView('home');
        setActivePaperId(null);
        navigate('/?', { replace: true });
      }
    };
  };

  const activePaper = papers.find(p => p.id === activePaperId);

  // --- Handlers ---
  const handleCreatePaper = () => {
    if (!newTitle.trim()) return;
    const newPaper = {
      id: generatePaperId(),
      title: newTitle.trim(),
      subtitle: '',
      createdAt: Date.now(),
      questions: [{ id: Date.now(), userAnswer: '', correctAnswer: '', type: 'input', starred: false, selectedOption: null, memo: '' }]
    };
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newPaper);
    request.onsuccess = () => {
      setNewTitle('');
      refreshPapers(db);
      setActivePaperId(newPaper.id);
      setView('exam');
      navigate(`/?id=${newPaper.id}&view=exam`, { replace: true });
    };
  };

  const handleCopyPaper = (id) => {
    const original = papers.find(p => p.id === id);
    if (!original) return;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    const copy = {
      ...original,
      id: generatePaperId(),
      subtitle: `복사본 (${timeStr})`,
      createdAt: now.getTime()
    };
    savePaperToDB(copy);
  };

  const handleOpenCopyModal = (id) => {
    setCopyModalPaperId(id);
    setCopyModalOpen(true);
  };

  const handleCloseCopyModal = () => {
    setCopyModalOpen(false);
    setCopyModalPaperId(null);
  };

  const handleConfirmCopy = () => {
    if (copyModalPaperId) {
      handleCopyPaper(copyModalPaperId);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteModalPaperId(id);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteModalPaperId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteModalPaperId) {
      deletePaperFromDB(deleteModalPaperId);
    }
  };

  const handleUpdateAnswer = (qIdx, val) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = { ...updatedPaper.questions[qIdx], userAnswer: val };

    // Auto-add next question if current is last and has content
    const addedNewQuestion = qIdx === updatedPaper.questions.length - 1 && val.trim() !== '';
    if (addedNewQuestion) {
      updatedPaper.questions.push({
        id: Date.now(),
        userAnswer: '',
        correctAnswer: '',
        type: updatedPaper.questions[qIdx].type,
        starred: false,
        selectedOption: null,
        memo: ''
      });
    }
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);

    // 새 문제가 추가되면 맨 아래로 부드럽게 스크롤
    if (addedNewQuestion) {
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleUpdateCorrectAnswer = (qIdx, val) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = { ...updatedPaper.questions[qIdx], correctAnswer: val };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleUpdateMemo = (qIdx, val) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = { ...updatedPaper.questions[qIdx], memo: val };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleResetAllCorrectAnswers = () => {
    if (!activePaper) return;
    if (!confirm('모든 Correct Answer를 초기화할까요?')) return;
    const updatedPaper = {
      ...activePaper,
      questions: activePaper.questions.map((q) => ({ ...q, correctAnswer: '' }))
    };
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

  const handleToggleStar = (qIdx) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = {
      ...updatedPaper.questions[qIdx],
      starred: !updatedPaper.questions[qIdx].starred
    };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleUpdateSelectedOption = (qIdx, option) => {
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = [...updatedPaper.questions];
    updatedPaper.questions[qIdx] = {
      ...updatedPaper.questions[qIdx],
      selectedOption: option
    };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleUpdateTitle = (newTitle) => {
    if (!activePaper) return;
    const updatedPaper = { ...activePaper, title: newTitle };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleUpdateSubtitle = (newSubtitle) => {
    if (!activePaper) return;
    const updatedPaper = { ...activePaper, subtitle: newSubtitle };
    setPapers((prev) => prev.map((p) => (p.id === activePaperId ? updatedPaper : p)));
    savePaperToDB(updatedPaper);
  };

  const handleSetAllUncheckedToA = () => {
    if (!activePaper) return;
    const updatedPaper = { ...activePaper };
    updatedPaper.questions = activePaper.questions.map((q) => {
      // ABC가 체크되지 않고 input이 비어있지 않은 항목만 'A'로 설정
      if (!q.selectedOption && q.userAnswer.trim() !== '') {
        return { ...q, selectedOption: 'A' };
      }
      return q;
    });
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
            id: typeof p.id === 'string' && p.id ? p.id : generatePaperId(),
            title: p.title,
            subtitle: p.subtitle ?? '',
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : base + i,
            questions: (p.questions || []).map((q, j) => ({
              id: base + i * 10000 + j,
              userAnswer: typeof q?.userAnswer === 'string' ? q.userAnswer : '',
              correctAnswer: typeof q?.correctAnswer === 'string' ? q.correctAnswer : '',
              type: q?.type === 'textarea' ? 'textarea' : 'input',
              starred: q?.starred === true,
              selectedOption: q?.selectedOption === 'A' || q?.selectedOption === 'B' || q?.selectedOption === 'C' ? q.selectedOption : null,
              memo: typeof q?.memo === 'string' ? q.memo : ''
            }))
          };
          if (paper.questions.length === 0) paper.questions = [{ id: base + i * 10000, userAnswer: '', correctAnswer: '', type: 'input', starred: false, selectedOption: null, memo: '' }];
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

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CLOUD_WORKER_URL_KEY, cloudWorkerUrl);
  }, [cloudWorkerUrl]);
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(CLOUD_MASTER_TOKEN_KEY, cloudMasterToken);
  }, [cloudMasterToken]);

  useEffect(() => {
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
    const hasEncrypted = !!localStorage.getItem(CLOUD_MASTER_TOKEN_ENCRYPTED_KEY);
    const hasSessionToken = !!sessionStorage.getItem(CLOUD_MASTER_TOKEN_KEY);
    if (hasEncrypted && !hasSessionToken) setShowUnlockModal(true);
  }, []);

  useEffect(() => {
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
    if (!localStorage.getItem(CLOUD_WORKER_URL_KEY) && sessionStorage.getItem(CLOUD_WORKER_URL_KEY)) {
      const u = sessionStorage.getItem(CLOUD_WORKER_URL_KEY);
      setCloudWorkerUrl(u);
      localStorage.setItem(CLOUD_WORKER_URL_KEY, u);
    }
  }, []);

  const getCloudKV = () => {
    const url = (cloudWorkerUrl || '').trim().replace(/\/$/, '');
    const token = (cloudMasterToken || '').trim();
    if (!url || !token) return null;
    return new CloudflareKV({ baseUrl: url, tokenName: CLOUD_MASTER_TOKEN_KEY });
  };

  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', type: 'default' });
  const showAlert = (title, message, type = 'default') => {
    setAlertModal({ open: true, title, message, type });
  };
  const closeAlertModal = () => setAlertModal((prev) => ({ ...prev, open: false }));

  const [toasts, setToasts] = useState([]);
  const addToast = (message, duration = 3000, variant = 'default') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, duration, variant }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const hasAutoLoadedCloudRef = useRef(false);
  const skipNextDebounceRef = useRef(false);
  const debounceSaveTimerRef = useRef(null);
  const papersRef = useRef(papers);
  papersRef.current = papers;

  const [debouncePending, setDebouncePending] = useState(false);
  const [debounceKey, setDebounceKey] = useState(0);

  const getPapersFromDB = (database) => {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  const clearAllPapersFromDB = () => {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        refreshPapers(db);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  };

  const normalizeCloudPaper = (p, base, i) => {
    if (!p || typeof p.title !== 'string' || !Array.isArray(p.questions)) return null;
    return {
      id: typeof p.id === 'string' && p.id ? p.id : generatePaperId(),
      title: p.title,
      subtitle: p.subtitle ?? '',
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : base + i,
      questions: (p.questions || []).map((q, j) => ({
        id: base + i * 10000 + j,
        userAnswer: typeof q?.userAnswer === 'string' ? q.userAnswer : '',
        correctAnswer: typeof q?.correctAnswer === 'string' ? q.correctAnswer : '',
        type: q?.type === 'textarea' ? 'textarea' : 'input',
        starred: q?.starred === true,
        selectedOption: q?.selectedOption === 'A' || q?.selectedOption === 'B' || q?.selectedOption === 'C' ? q.selectedOption : null,
        memo: typeof q?.memo === 'string' ? q.memo : ''
      }))
    };
  };

  const mergeCloudIntoLocal = (record) => {
    if (!db) return Promise.resolve();
    const list = Array.isArray(record) ? record : (record != null ? [record] : []);
    const base = Date.now();
    const normalizedCloud = [];
    for (let i = 0; i < list.length; i++) {
      const paper = normalizeCloudPaper(list[i], base, i);
      if (paper) {
        if (paper.questions.length === 0) paper.questions = [{ id: base + i * 10000, userAnswer: '', correctAnswer: '', type: 'input', starred: false, selectedOption: null, memo: '' }];
        normalizedCloud.push(paper);
      }
    }
    return getPapersFromDB(db).then((localPapers) => {
      const localIds = new Set(localPapers.map((p) => p.id));
      const toUpdate = normalizedCloud.filter((p) => localIds.has(p.id));
      if (toUpdate.length === 0) {
        refreshPapers(db);
        return;
      }
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        toUpdate.forEach((paper) => store.put(paper));
        tx.oncomplete = () => {
          refreshPapers(db);
          resolve();
        };
      });
    });
  };

  const handleSettingsSave = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLOUD_WORKER_URL_KEY, cloudWorkerUrl);
    }
    const token = (cloudMasterToken || '').trim();
    if (token) {
      setShowSavePasswordModal(true);
    } else {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(CLOUD_MASTER_TOKEN_ENCRYPTED_KEY);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(CLOUD_MASTER_TOKEN_KEY);
      showAlert('저장 완료', '저장되었습니다.');
    }
  };

  const handleSavePasswordConfirm = async (password) => {
    if (!password.trim()) return;
    try {
      const encrypted = await encryptMasterToken((cloudMasterToken || '').trim(), password);
      if (typeof localStorage !== 'undefined') localStorage.setItem(CLOUD_MASTER_TOKEN_ENCRYPTED_KEY, encrypted);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CLOUD_MASTER_TOKEN_KEY, cloudMasterToken);
      setShowSavePasswordModal(false);
      showAlert('저장 완료', '저장되었습니다.');
    } catch (err) {
      showAlert('저장 실패', '암호화 중 오류가 발생했습니다. ' + (err?.message || ''), 'danger');
    }
  };

  const handleUnlockConfirm = async (password) => {
    if (!password.trim()) return;
    setUnlockError('');
    const encrypted = typeof localStorage !== 'undefined' ? localStorage.getItem(CLOUD_MASTER_TOKEN_ENCRYPTED_KEY) : null;
    if (!encrypted) {
      setShowUnlockModal(false);
      return;
    }
    try {
      const decrypted = await decryptMasterToken(encrypted, password);
      setCloudMasterToken(decrypted);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CLOUD_MASTER_TOKEN_KEY, decrypted);
      setShowUnlockModal(false);
      const url = (cloudWorkerUrl || '').trim().replace(/\/$/, '');
      if (url) {
        const kv = new CloudflareKV({ baseUrl: url, tokenName: CLOUD_MASTER_TOKEN_KEY });
        kv.readData(currentFolderKey)
          .then((record) => mergeCloudIntoLocal(record))
          .then(() => addToast('클라우드에서 불러왔습니다.'))
          .catch(() => {});
      }
    } catch {
      setUnlockError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleExportPasswordConfirm = async (password) => {
    if (!password.trim()) return;
    try {
      const payload = JSON.stringify({
        workerUrl: (cloudWorkerUrl || '').trim(),
        masterToken: (cloudMasterToken || '').trim()
      });
      const encrypted = await encryptMasterToken(payload, password);
      const blob = new Blob([encrypted], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-cloud-backup-${new Date().toISOString().slice(0, 10)}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportPasswordModal(false);
      showAlert('내보내기 완료', '클라우드 저장 정보가 암호화된 파일로 저장되었습니다.');
    } catch (err) {
      showAlert('내보내기 실패', '암호화 중 오류가 발생했습니다. ' + (err?.message || ''), 'danger');
    }
  };

  const handleImportPasswordConfirm = async (password) => {
    if (!password.trim() || !importFileContent) return;
    setImportError('');
    try {
      const decrypted = await decryptMasterToken(importFileContent, password);
      const data = JSON.parse(decrypted);
      const workerUrl = typeof data.workerUrl === 'string' ? data.workerUrl.trim() : '';
      const masterToken = typeof data.masterToken === 'string' ? data.masterToken.trim() : '';
      setCloudWorkerUrl(workerUrl);
      if (typeof localStorage !== 'undefined') localStorage.setItem(CLOUD_WORKER_URL_KEY, workerUrl);
      setCloudMasterToken(masterToken);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CLOUD_MASTER_TOKEN_KEY, masterToken);
      setImportFileContent(null);
      setShowImportPasswordModal(false);
      if (masterToken) {
        setShowSavePasswordModal(true);
      } else {
        showAlert('가져오기 완료', '클라우드 저장 정보를 불러왔습니다.');
      }
    } catch {
      setImportError('비밀번호가 올바르지 않거나 파일 형식이 맞지 않습니다.');
    }
  };

  const handleExportCloudBackup = () => setShowExportPasswordModal(true);

  const handleImportCloudBackupClick = () => {
    setImportError('');
    setImportFileContent(null);
    cloudBackupFileInputRef.current?.click();
  };

  const handleImportCloudBackupFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportFileContent(text);
      setShowImportPasswordModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSettingsTestConnection = async () => {
    const kv = getCloudKV();
    if (!kv) {
      showAlert('설정 필요', 'Worker URL과 MASTER_TOKEN을 입력해 주세요.', 'warning');
      return;
    }
    try {
      await kv.readData(FOLDERS_KV_KEY);
      addToast('연결되었습니다.');
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes('404') || msg.includes('Not Found')) {
        addToast('연결되었습니다.');
        return;
      }
      showAlert('연결 실패', '연결 실패: ' + msg, 'danger');
      throw err;
    }
  };

  const handleCloudSave = async () => {
    if (cloudSaveLoading || cloudSaveSuccess) return;
    const kv = getCloudKV();
    if (!kv) {
      showAlert('설정 필요', '설정에서 Worker URL과 MASTER_TOKEN을 입력해 주세요.', 'warning');
      return;
    }
    setCloudSaveLoading(true);
    try {
      await kv.updateData(currentFolderKey, papers);
      addToast('클라우드에 저장되었습니다.');
      setCloudSaveSuccess(true);
    } catch (err) {
      showAlert('저장 실패', '저장 실패: ' + (err?.message || String(err)), 'danger');
    } finally {
      setCloudSaveLoading(false);
    }
  };

  const handleCloudLoad = async () => {
    if (cloudLoadLoading || cloudLoadSuccess) return;
    const kv = getCloudKV();
    if (!kv) {
      showAlert('설정 필요', '설정에서 Worker URL과 MASTER_TOKEN을 입력해 주세요.', 'warning');
      return;
    }
    setCloudLoadLoading(true);
    skipNextDebounceRef.current = true;
    if (debounceSaveTimerRef.current) {
      clearTimeout(debounceSaveTimerRef.current);
      debounceSaveTimerRef.current = null;
      setDebouncePending(false);
    }
    try {
      const record = await kv.readData(currentFolderKey);
      await handleLoadFromCloud(record);
      addToast('클라우드에서 불러왔습니다.');
      setCloudLoadSuccess(true);
    } catch (err) {
      showAlert('불러오기 실패', '불러오기 실패: ' + (err?.message || String(err)), 'danger');
    } finally {
      setCloudLoadLoading(false);
    }
  };

  const handleLoadFromCloud = (record) => {
    if (!db) return Promise.resolve();
    try {
      const list = Array.isArray(record) ? record : (record != null ? [record] : []);
      const base = Date.now();
      const toAdd = [];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p || typeof p.title !== 'string' || !Array.isArray(p.questions)) continue;
        const paper = {
          id: typeof p.id === 'string' && p.id ? p.id : generatePaperId(),
          title: p.title,
          subtitle: p.subtitle ?? '',
          createdAt: typeof p.createdAt === 'number' ? p.createdAt : base + i,
          questions: (p.questions || []).map((q, j) => ({
            id: base + i * 10000 + j,
            userAnswer: typeof q?.userAnswer === 'string' ? q.userAnswer : '',
            correctAnswer: typeof q?.correctAnswer === 'string' ? q.correctAnswer : '',
            type: q?.type === 'textarea' ? 'textarea' : 'input',
            starred: q?.starred === true,
            selectedOption: q?.selectedOption === 'A' || q?.selectedOption === 'B' || q?.selectedOption === 'C' ? q.selectedOption : null,
            memo: typeof q?.memo === 'string' ? q.memo : ''
          }))
        };
        if (paper.questions.length === 0) paper.questions = [{ id: base + i * 10000, userAnswer: '', correctAnswer: '', type: 'input', starred: false, selectedOption: null, memo: '' }];
        toAdd.push(paper);
      }
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        toAdd.forEach((paper) => store.add(paper));
        transaction.oncomplete = () => {
          refreshPapers(db);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      showAlert('데이터 오류', '불러온 데이터 형식이 올바르지 않습니다.', 'danger');
      return Promise.reject(err);
    }
  };

  const handleSwitchFolder = async (newKey) => {
    if (newKey === currentFolderKey) return;
    const kv = getCloudKV();
    if (!kv) return;
    setCloudLoadLoading(true);
    const oldKey = currentFolderKey;
    const toUpload = papersRef.current;
    try {
      await kv.updateData(oldKey, toUpload);
    } catch {
      addToast('작업 실패', 3000, 'error');
      setCloudLoadLoading(false);
      return;
    }
    try {
      await clearAllPapersFromDB();
      const record = await kv.readData(newKey).catch(() => []);
      await handleLoadFromCloud(record);
      setCurrentFolderKey(newKey);
      setView('home');
      setActivePaperId(null);
      navigate('/?');
      addToast('클라우드에서 불러왔습니다.');
    } catch {
      addToast('작업 실패', 3000, 'error');
    } finally {
      setCloudLoadLoading(false);
    }
  };

  const handleOpenAddFolderModal = () => {
    if (!getCloudKV()) {
      showAlert('설정 필요', '클라우드 저장을 먼저 설정해 주세요.', 'warning');
      return;
    }
    setAddFolderModalOpen(true);
  };

  const handleAddFolder = async (alias) => {
    const kv = getCloudKV();
    if (!kv) return;
    const key = `list-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    const newKeys = [...(folders.keys || []), key];
    const newAliases = { ...(folders.aliases || {}), [key]: (alias || '').trim() || key };
    const newFolders = { keys: newKeys, aliases: newAliases };
    try {
      await kv.updateData(FOLDERS_KV_KEY, newFolders);
      setFolders(newFolders);
      addToast('새 문제지 목록이 추가되었습니다.');
    } catch (err) {
      showAlert('추가 실패', '저장 실패: ' + (err?.message || String(err)), 'danger');
    }
  };

  const handleOpenDeleteFolderModal = (key) => {
    setDeleteFolderKey(key);
    setDeleteFolderModalOpen(true);
  };

  const handleRenameFolder = async (key, newAlias) => {
    const kv = getCloudKV();
    if (!kv) return;
    const trimmed = (newAlias || '').trim() || key;
    const newAliases = { ...(folders.aliases || {}), [key]: trimmed };
    const newFolders = { keys: folders.keys || [], aliases: newAliases };
    try {
      await kv.updateData(FOLDERS_KV_KEY, newFolders);
      setFolders(newFolders);
      addToast('이름이 변경되었습니다.');
    } catch (err) {
      showAlert('변경 실패', '저장 실패: ' + (err?.message || String(err)), 'danger');
    }
  };

  const handleCloseDeleteFolderModal = () => {
    setDeleteFolderModalOpen(false);
    setDeleteFolderKey(null);
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderKey) return;
    if ((folders.keys || []).length <= 1) {
      showAlert('삭제 불가', '마지막 문제지 목록은 삭제할 수 없습니다.', 'warning');
      handleCloseDeleteFolderModal();
      return;
    }
    const kv = getCloudKV();
    if (!kv) {
      handleCloseDeleteFolderModal();
      return;
    }
    const newKeys = folders.keys.filter((k) => k !== deleteFolderKey);
    const newAliases = { ...folders.aliases };
    delete newAliases[deleteFolderKey];
    const newFolders = { keys: newKeys, aliases: newAliases };
    try {
      await kv.deleteData(deleteFolderKey).catch(() => {});
      await kv.updateData(FOLDERS_KV_KEY, newFolders);
      setFolders(newFolders);
      if (currentFolderKey === deleteFolderKey) {
        const nextKey = newKeys[0];
        setCurrentFolderKey(nextKey);
        await clearAllPapersFromDB();
        const record = await kv.readData(nextKey).catch(() => []);
        await handleLoadFromCloud(record);
        setView('home');
        setActivePaperId(null);
        navigate('/?');
      }
      addToast('문제지 목록이 삭제되었습니다.');
    } catch (err) {
      addToast('작업 실패', 3000, 'error');
    }
    handleCloseDeleteFolderModal();
  };

  const currentView =
    view === 'home' ? (
      <HomeView
        papers={papers}
        setView={setView}
        setActivePaperId={setActivePaperId}
        navigate={navigate}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        onCreatePaper={handleCreatePaper}
        onCopyPaper={handleCopyPaper}
        onDeletePaper={deletePaperFromDB}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onCloudSave={handleCloudSave}
        onCloudLoad={handleCloudLoad}
        cloudSaveLoading={cloudSaveLoading}
        cloudSaveSuccess={cloudSaveSuccess}
        cloudLoadLoading={cloudLoadLoading}
        cloudLoadSuccess={cloudLoadSuccess}
        importInputRef={importInputRef}
        copyModalOpen={copyModalOpen}
        copyModalPaperId={copyModalPaperId}
        onOpenCopyModal={handleOpenCopyModal}
        onCloseCopyModal={handleCloseCopyModal}
        onConfirmCopy={handleConfirmCopy}
        deleteModalOpen={deleteModalOpen}
        deleteModalPaperId={deleteModalPaperId}
        onOpenDeleteModal={handleOpenDeleteModal}
        onCloseDeleteModal={handleCloseDeleteModal}
        onConfirmDelete={handleConfirmDelete}
        folders={folders}
        currentFolderKey={currentFolderKey}
        onSwitchFolder={handleSwitchFolder}
        cloudEnabled={!!getCloudKV()}
      />
    ) : view === 'settings' ? (
      <SettingsView
        workerUrl={cloudWorkerUrl}
        masterToken={cloudMasterToken}
        onWorkerUrlChange={setCloudWorkerUrl}
        onMasterTokenChange={setCloudMasterToken}
        onSave={handleSettingsSave}
        onTestConnection={handleSettingsTestConnection}
        onExportCloudBackup={handleExportCloudBackup}
        onImportCloudBackup={handleImportCloudBackupClick}
        setView={setView}
        navigate={navigate}
        folders={folders}
        currentFolderKey={currentFolderKey}
        cloudEnabled={!!getCloudKV()}
        onOpenAddFolderModal={handleOpenAddFolderModal}
        onOpenDeleteFolderModal={handleOpenDeleteFolderModal}
        onRenameFolder={handleRenameFolder}
      />
    ) : view === 'howto' ? (
      <HowToView
        masterTokenStorageKey={CLOUD_MASTER_TOKEN_KEY}
        onMasterTokenGenerated={(token) => {
          setCloudMasterToken(token);
          if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CLOUD_MASTER_TOKEN_KEY, token);
        }}
        setView={setView}
        navigate={navigate}
      />
    ) : view === 'exam' ? (
      <ExamView
        activePaper={activePaper}
        setView={setView}
        navigate={navigate}
        activePaperId={activePaperId}
        onUpdateAnswer={handleUpdateAnswer}
        onToggleType={handleToggleType}
        onToggleStar={handleToggleStar}
        focusNextInput={focusNextInput}
        onUpdateSelectedOption={handleUpdateSelectedOption}
        onUpdateTitle={handleUpdateTitle}
        onUpdateSubtitle={handleUpdateSubtitle}
        onSetAllUncheckedToA={handleSetAllUncheckedToA}
      />
    ) : (
      <ScoreView
        activePaper={activePaper}
        setView={setView}
        navigate={navigate}
        activePaperId={activePaperId}
        onUpdateCorrectAnswer={handleUpdateCorrectAnswer}
        onUpdateMemo={handleUpdateMemo}
        onResetAllCorrectAnswers={handleResetAllCorrectAnswers}
        onToggleStar={handleToggleStar}
        onUpdateTitle={handleUpdateTitle}
        onUpdateSubtitle={handleUpdateSubtitle}
      />
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 pb-20">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex justify-between items-center">
          <button 
            onClick={() => { setView('home'); setActivePaperId(null); navigate('/?'); }} 
            className="flex items-center gap-2 group"
          >
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">ExamMaster</h1>
          </button>

          {view === 'home' && (
            <button
              type="button"
              onClick={() => { setView('settings'); navigate('?view=settings'); }}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="설정 (클라우드)"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {view === 'howto' && (
            <button
              onClick={() => { setView('home'); navigate('/?'); }}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Home className="w-4 h-4" /> 홈으로
            </button>
          )}
          
          {(view === 'exam' || view === 'score') && (
            <button 
              onClick={() => { setView('home'); setActivePaperId(null); navigate('/?'); }}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Home className="w-4 h-4" /> 홈으로
            </button>
          )}
          {view === 'settings' && (
            <button 
              onClick={() => { setView('home'); navigate('/?'); }}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Home className="w-4 h-4" /> 홈으로
            </button>
          )}
        </header>

        <main>
          {currentView}
        </main>
      </div>

      {/* Floating: debounce status (좌측 하단) */}
      {debouncePending && (
        <div
          key={debounceKey}
          className="fixed bottom-8 left-8 z-40 flex flex-col gap-1 min-w-[140px] px-3 py-2 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          aria-live="polite"
          aria-label="클라우드 저장 대기 중"
        >
          <span className="text-xs font-medium">저장 대기 중</span>
          <div className="h-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full origin-left"
              style={{
                animation: 'debounce-progress 5s linear forwards'
              }}
            />
          </div>
        </div>
      )}

      {/* Floating: scroll to top (좌측 하단, 저장 대기 시 그 오른쪽으로) */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 left-8 p-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-2xl transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'} ${debouncePending ? 'translate-x-[180px]' : ''}`}
        aria-label="맨 위로"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      <ConfirmModal
        variant="alert"
        isOpen={alertModal.open}
        onClose={closeAlertModal}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="확인"
        type={alertModal.type}
      />

      <ConfirmModal
        isOpen={deleteFolderModalOpen}
        onClose={handleCloseDeleteFolderModal}
        onConfirm={handleConfirmDeleteFolder}
        title="문제지 목록 삭제"
        message={deleteFolderKey ? `"${folders.aliases?.[deleteFolderKey] ?? deleteFolderKey}" 문제지 목록을 삭제하시겠습니까? 클라우드에 저장된 해당 목록 데이터도 삭제되며 되돌릴 수 없습니다.` : ''}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />

      <PromptModal
        isOpen={addFolderModalOpen}
        onClose={() => setAddFolderModalOpen(false)}
        onConfirm={(value) => handleAddFolder(value)}
        title="새 문제지 목록"
        message="목록에 표시할 이름을 입력하세요."
        placeholder="목록 이름"
        confirmText="추가"
        cancelText="취소"
        defaultValue=""
      />

      <PasswordConfirmModal
        isOpen={showUnlockModal}
        onClose={() => { setShowUnlockModal(false); setUnlockError(''); }}
        onConfirm={handleUnlockConfirm}
        title="로그인"
        message="클라우드 백업을 사용하기 위해 설정하셨던 비밀번호를 입력하세요."
        confirmText="확인"
        cancelText="취소"
        error={unlockError}
      />

      <PasswordConfirmModal
        isOpen={showSavePasswordModal}
        onClose={() => setShowSavePasswordModal(false)}
        onConfirm={handleSavePasswordConfirm}
        title="클라우드 백업 비밀번호 설정"
        message="클라우드 백업용 MASTER_KEY를 암호화하기 위한 비밀번호를 입력하세요. 이 비밀번호를 잊어버리면 저장된 클라우드에 데이터를 백업하거나 복구할 수 없습니다. 반드시 잊지 않도록 하세요."
        confirmText="저장"
        cancelText="취소"
        type="warning"
      />

      <PasswordConfirmModal
        isOpen={showExportPasswordModal}
        onClose={() => setShowExportPasswordModal(false)}
        onConfirm={handleExportPasswordConfirm}
        title="클라우드 저장 정보 내보내기"
        message="내보낸 파일을 암호화할 비밀번호를 입력하세요. 가져올 때 이 비밀번호가 필요합니다."
        confirmText="내보내기"
        cancelText="취소"
      />

      <PasswordConfirmModal
        isOpen={showImportPasswordModal}
        onClose={() => { setShowImportPasswordModal(false); setImportFileContent(null); setImportError(''); }}
        onConfirm={handleImportPasswordConfirm}
        title="클라우드 저장 정보 가져오기"
        message="클라우드 백업을 사용하기 위해 설정하셨던 비밀번호를 입력하세요."
        confirmText="확인"
        cancelText="취소"
        error={importError}
      />

      <input
        ref={cloudBackupFileInputRef}
        type="file"
        accept=".enc,application/octet-stream,text/plain"
        onChange={handleImportCloudBackupFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}