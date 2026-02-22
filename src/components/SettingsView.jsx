import React, { useState, useEffect } from 'react';
import { Settings, Home, Eye, EyeOff, Upload, Download, FolderOpen, Plus, Trash2, Pencil } from 'lucide-react';

const SUCCESS_DURATION_MS = 3000;

function SettingsView({
  workerUrl,
  masterToken,
  onWorkerUrlChange,
  onMasterTokenChange,
  onSave,
  onTestConnection,
  onExportCloudBackup,
  onImportCloudBackup,
  setView,
  navigate,
  folders,
  currentFolderKey,
  cloudEnabled,
  onAddFolder,
  onOpenDeleteFolderModal,
  onRenameFolder
}) {
  const [showMasterToken, setShowMasterToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [editingFolderKey, setEditingFolderKey] = useState(null);
  const [editingAlias, setEditingAlias] = useState('');

  useEffect(() => {
    if (!connectionSuccess) return;
    const t = setTimeout(() => setConnectionSuccess(false), SUCCESS_DURATION_MS);
    return () => clearTimeout(t);
  }, [connectionSuccess]);

  const normalizeWorkerUrl = (value) => {
    const v = (value || '').trim();
    if (!v) return v;
    if (v.startsWith('https://')) return v;
    if (v.startsWith('http://')) return 'https://' + v.slice(7);
    return 'https://' + v;
  };

  const handleWorkerUrlBlur = () => {
    if (!workerUrl.trim().startsWith('https://')) {
      onWorkerUrlChange(normalizeWorkerUrl(workerUrl));
    }
  };

  const handleTestConnection = async () => {
    if (!onTestConnection || testing || connectionSuccess) return;
    setTesting(true);
    try {
      await onTestConnection();
      setConnectionSuccess(true);
    } finally {
      setTesting(false);
    }
  };

  const testButtonDisabled = testing || connectionSuccess;
  const testButtonSuccess = connectionSuccess && !testing;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
          <Settings className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 클라우드 저장 설정
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Worker URL과 MASTER_TOKEN을 설정하면 홈에서 클라우드 저장/불러오기를 사용할 수 있습니다. 설정 방법은 <button type="button" onClick={() => navigate('?view=howto')} className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline font-medium">Worker 배포 방법 보기</button>를 참고하세요.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Worker URL</label>
            <input
              type="url"
              value={workerUrl}
              onChange={(e) => onWorkerUrlChange(e.target.value)}
              onBlur={handleWorkerUrlBlur}
              placeholder="https://your-worker.workers.dev"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MASTER_TOKEN</label>
            <div className="relative flex">
              <input
                type={showMasterToken ? 'text' : 'password'}
                value={masterToken}
                onChange={(e) => onMasterTokenChange(e.target.value)}
                placeholder="Worker Secrets에 설정한 값"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                onMouseDown={() => setShowMasterToken(true)}
                onMouseUp={() => setShowMasterToken(false)}
                onMouseLeave={() => setShowMasterToken(false)}
                aria-label={showMasterToken ? '토큰 숨기기' : '토큰 보기'}
              >
                {showMasterToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={onSave}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm"
            >
              저장
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testButtonDisabled}
              className={`px-4 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5 ${
                testButtonSuccess
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border border-emerald-600 dark:border-emerald-500 cursor-default'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none'
              }`}
            >
              {testing && '연결 중…'}
              {connectionSuccess && !testing && (
                <>
                  <span className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-500 text-xs font-bold">✓</span>
                  </span>
                  연결됨
                </>
              )}
              {!testing && !connectionSuccess && '연결 테스트'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
            <button
              type="button"
              onClick={onExportCloudBackup}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm"
            >
              <Upload className="size-4" />
              클라우드 저장 정보 내보내기
            </button>
            <button
              type="button"
              onClick={onImportCloudBackup}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm"
            >
              <Download className="size-4" />
              클라우드 저장 정보 가져오기
            </button>
          </div>
        </div>
      </div>

      {cloudEnabled && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
            <FolderOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 문제지 목록 관리
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            클라우드에 저장된 문제지 목록을 추가하거나 삭제할 수 있습니다. 목록을 전환하려면 홈 화면에서 드롭다운을 사용하세요.
          </p>
          <div className="space-y-2">
            {(folders?.keys ?? []).map((key) => {
              const isEditing = editingFolderKey === key;
              return (
                <div key={key} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editingAlias}
                        onChange={(e) => setEditingAlias(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const trimmed = (editingAlias || '').trim() || key;
                            onRenameFolder(key, trimmed);
                            setEditingFolderKey(null);
                          } else if (e.key === 'Escape') {
                            setEditingFolderKey(null);
                            setEditingAlias('');
                          }
                        }}
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                        placeholder="목록 이름"
                        autoFocus
                        aria-label="목록 이름"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = (editingAlias || '').trim() || key;
                            onRenameFolder(key, trimmed);
                            setEditingFolderKey(null);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolderKey(null);
                            setEditingAlias('');
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{folders.aliases?.[key] ?? key}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {currentFolderKey === key && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">현재 선택</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolderKey(key);
                            setEditingAlias(folders.aliases?.[key] ?? key);
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="이름 변경"
                          aria-label="이름 변경"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDeleteFolderModal(key)}
                          disabled={(folders?.keys?.length ?? 0) <= 1}
                          className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                          title={(folders?.keys?.length ?? 0) <= 1 ? '마지막 목록은 삭제할 수 없습니다' : '목록 삭제'}
                          aria-label="목록 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onAddFolder}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 새 문제지 목록
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => { setView('home'); navigate('/?'); }}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <Home className="w-4 h-4" /> 홈으로
      </button>
    </div>
  );
}

export default SettingsView;
