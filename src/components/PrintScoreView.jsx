import React from 'react';
import { X, Printer } from 'lucide-react';
import { parseMarkdown } from '../utils/markdownParser';

/**
 * 채점 결과 인쇄 뷰
 * - 전체: 문항번호 | 내 답변 | 정답 (한 페이지에 많이)
 * - 틀린 문제만: 문항번호·내 답변·정답 크게, 페이지 나눔
 */
function PrintScoreView({ title, questions, onClose }) {
  const wrongOnly = questions.filter(
    (q) => q.correctAnswer.trim() !== '' && q.userAnswer.trim() !== q.correctAnswer.trim()
  );

  const handlePrint = () => window.print();

  return (
    <div className="print-view-container fixed inset-0 z-100 overflow-auto bg-gray-100 p-4 print:bg-white print:p-0">
      {/* 툴바: 화면에서만 표시 */}
      <div className="no-print mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">인쇄 미리보기</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Printer className="w-4 h-4" /> 인쇄
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> 닫기
          </button>
        </div>
      </div>

      {/* 인쇄용 본문 */}
      <div className="print-content mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm print:max-w-none print:shadow-none print:p-4 print:pb-0">
        <h1 className="mb-6 border-b border-gray-200 pb-2 text-xl font-bold text-gray-900 print:mb-4 print:text-lg">
          채점 결과: {title}
        </h1>

        {/* 1. 전체 채점 결과 (압축) */}
        <section className="mb-8 print:mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-indigo-600 print:mb-2 print:text-xs">
            전체 채점 결과
          </h2>
          <table className="w-full border-collapse text-sm print:text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="w-14 py-1.5 text-left font-bold text-gray-600 print:py-1 print:w-12">No.</th>
                <th className="p-1.5 text-left font-bold text-gray-600 print:p-1">내 답변</th>
                <th className="p-1.5 text-left font-bold text-gray-600 print:p-1">정답</th>
                <th className="p-1.5 text-left font-bold text-gray-600 print:p-1">메모</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => {
                const isWrong =
                  q.correctAnswer.trim() !== '' && q.userAnswer.trim() !== q.correctAnswer.trim();
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 print:break-inside-avoid ${
                      isWrong
                        ? 'bg-red-50/50 print:bg-red-50/30 border-l-4 border-l-red-500 print:border-l-4 print:border-l-gray-800'
                        : ''
                    }`}
                  >
                    <td className="py-1.5 font-bold text-indigo-600 print:py-1">
                      {idx + 1}
                      {isWrong && (
                        <span className="ml-1 font-black text-red-600 print:text-gray-900" title="틀림">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="max-w-[30%] p-1.5 text-gray-700 print:p-1 print:leading-tight">
                      {q.userAnswer || '—'}
                    </td>
                    <td className="max-w-[30%] p-1.5 text-gray-700 print:p-1 print:leading-tight">
                      {q.correctAnswer || '—'}
                    </td>
                    <td className="max-w-[30%] p-1.5 text-gray-700 print:p-1 print:leading-tight">
                      {q.memo?.trim() ? (
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(q.memo) }} />
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 2. 틀린 문제만 (큰 글씨, 페이지 절약) */}
        {wrongOnly.length > 0 && (
          <section className="print:break-before-page print:mb-0">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-red-600 print:mb-2 print:text-xs">
              틀린 문제 ({wrongOnly.length}개)
            </h2>
            <div className="space-y-4 print:space-y-3">
              {questions.map((q, idx) => {
                const isWrong =
                  q.correctAnswer.trim() !== '' && q.userAnswer.trim() !== q.correctAnswer.trim();
                if (!isWrong) return null;
                return (
                  <div
                    key={idx}
                    className="break-inside-avoid rounded-lg border-2 border-red-200 bg-red-50/50 p-4 print:border-2 print:border-gray-800 print:p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg font-black text-indigo-600 print:text-base">
                        문항 {idx + 1}
                      </span>
                      <span className="rounded px-1.5 py-0.5 text-xs font-black text-red-600 ring-1 ring-red-300 print:bg-gray-200 print:text-gray-900 print:ring-1 print:ring-gray-800">
                        ✗ 틀림
                      </span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm print:gap-x-3 print:text-xs">
                      <span className="font-bold text-gray-500">내 답:</span>
                      <span className="text-gray-800">{q.userAnswer || '—'}</span>
                      <span className="font-bold text-gray-500">정답:</span>
                      <span className="font-medium text-gray-900">{q.correctAnswer}</span>
                      {q.memo?.trim() && (
                        <>
                          <span className="font-bold text-gray-500">메모:</span>
                          <span className="text-gray-700 italic" dangerouslySetInnerHTML={{ __html: parseMarkdown(q.memo) }} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default PrintScoreView;
