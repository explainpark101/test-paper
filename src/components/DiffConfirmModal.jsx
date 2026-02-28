import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import MemoViewer from './MemoViewer';

/**
 * 기존 내용과 새 내용을 나란히 보여주고, 확인 시 onConfirm()을 호출하는 모달.
 * 등장/퇴장 애니메이션 적용.
 */
function DiffConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  oldText = '',
  newText = '',
  title = '내용 적용 확인',
  transformDescription = '',
  confirmText = '적용',
  cancelText = '취소'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (shouldRender) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [shouldRender]);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shouldRender, onClose]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 transform transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className={`text-xl font-bold text-gray-900 dark:text-gray-100 pr-8 ${transformDescription ? 'mb-1' : 'mb-4'}`}>
          {title}
        </h3>
        {transformDescription ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            변환 유형: {transformDescription}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">기존 내용</span>
            <div className="flex-1 min-h-[120px] overflow-auto p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 [&_.memo-viewer-wrap]:cursor-default">
              <MemoViewer
                editorId="diff-modal-old"
                value={oldText || ''}
                onFocus={() => {}}
                className="[&_.md-editor-preview]:p-0! [&_.md-editor-preview-wrapper]:p-0!"
              />
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              AI 결과 (적용 시 대치)
            </span>
            <div className="flex-1 min-h-[120px] overflow-auto p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 [&_.memo-viewer-wrap]:cursor-default">
              <MemoViewer
                editorId="diff-modal-new"
                value={newText || ''}
                onFocus={() => {}}
                className="[&_.md-editor-preview]:p-0! [&_.md-editor-preview-wrapper]:p-0!"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all font-medium shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiffConfirmModal;
