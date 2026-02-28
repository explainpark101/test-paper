const MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const GLOBAL_PROMPT_PREFIX = `DO NOT OUTPUT ANYTHING ELSE THAN THE MARKDOWN CONTENT. 되도록이면 모든 정보는 "~임." 형태의 단조체로 적도록 해.\n\n`;
const PROMPT_PREFIX = {
  bullet:
`역할: 너는 "암기 친화 요약 편집자"다.
목표: 아래 원문을 암기/복습하기 쉬운 "단조체 bullet point"로 변환하라.

규칙(중요):
- 원문 의미를 바꾸지 말고, 핵심을 빠짐없이 구조화한다.
- 원문에 없는 사실/수치/고유명사/원인-결과를 새로 만들지 마라.
- 모호한 표현은 임의로 확정하지 말고, 원문의 표현 수준을 유지하라(필요하면 '…일 수 있음'처럼 표시).
- 군더더기 서론/결론/메타 설명을 쓰지 말고 "변환 결과"만 출력하라.
- 출력은 Markdown만 사용하라. (코드블록 금지)
- 수식은 LaTeX 문법을 사용하며, 인라인 수식은 $...$, 블록 수식은 $$...$$ 로 감싸서 표현하라.
- 제목 체계: 최상위는 ##(h2), 하위는 ######(h6)까지 사용 가능.
- 리스트는 '-' bullet만 사용하라. (번호 리스트 금지)

형식 가이드:
- 각 섹션은 "정의/핵심/근거/예시/주의" 순서로 정리하되, 원문에 없는 항목은 만들지 말 것.
- 긴 문장은 '키워드: 설명' 형태로 쪼개라.
- 대비가 있으면 'A vs B' 형태로 정리하라.
- 암기 포인트는 ✅로 표시하되, 원문 근거가 있을 때만 사용하라.

원문:
`,

  narrative:
`역할: 너는 "설명형 교재 편집자"다.
목표: 아래 원문을 더 이해하기 쉬운 "서술체"로 재작성하라(부연설명 포함).

규칙(중요):
- 원문 내용을 충실히 반영하되, 이해를 돕는 범위에서만 부연한다.
- 원문에 없는 새로운 주장/사실/수치/출처는 추가하지 마라.
- 부연은 (1) 정의 풀어쓰기, (2) 문장 간 연결, (3) 전개 순서 정돈, (4) 일반적 예시(원문 의미를 바꾸지 않는 수준)로 제한한다.
- 원문이 불명확하면 단정하지 말고, 가능한 해석을 '가능한 의미:'로 짧게 제시하라(최대 2개).
- 군더더기 서론/결론/메타 설명 없이 "작성 결과"만 출력하라.
- 출력은 Markdown만 사용하라. (코드블록 금지)
- 수식은 LaTeX 문법을 사용하며, 인라인 수식은 $...$, 블록 수식은 $$...$$ 로 감싸서 표현하라.
- 제목 체계: 최상위는 ##(h2), 하위는 ######(h6)까지 사용 가능.

스타일 가이드:
- 문장은 짧고 명확하게. 너무 과장하거나 감정적인 표현 금지.
- 섹션마다 핵심 문장 1개 → 그 뒤에 설명/예시 순으로 전개.
- 필요 시 용어는 "용어(간단 정의)" 형태로 최초 1회만 정의.

원문:
`
};
/**
 * @param {'bullet'|'narrative'} promptType
 * @param {string} [customPrompt] - 사용 시 promptType은 'custom'으로 간주
 * @param {string} text - 메모 본문
 * @returns {string} fullPrompt
 */
export function buildFullPrompt(promptType, customPrompt, text) {
  const body = (text || '').trim();
  if (promptType === 'custom' && customPrompt != null) {
    return GLOBAL_PROMPT_PREFIX + (customPrompt.trim() + '\n\n' + body).trim();
  }
  const prefix = PROMPT_PREFIX[promptType] ?? PROMPT_PREFIX.bullet;
  return GLOBAL_PROMPT_PREFIX + prefix + body;
}

/**
 * @param {string} apiKey
 * @param {'bullet'|'narrative'|'custom'} promptType
 * @param {string} text - 메모 본문
 * @param {string} [customPrompt] - promptType === 'custom'일 때 사용
 * @returns {Promise<string>} generated text
 */
export async function generateMemoContent(apiKey, promptType, text, customPrompt) {
  const fullPrompt = buildFullPrompt(promptType, customPrompt, text);
  if (!fullPrompt.trim()) throw new Error('변환할 내용이 없습니다.');

  const url = `${BASE_URL}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }]
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    let msg = `API 오류 (${res.status})`;
    try {
      const j = JSON.parse(errBody);
      msg = j.error?.message || msg;
    } catch {
      if (errBody) msg += ': ' + errBody.slice(0, 200);
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  const generated = part?.text?.trim();
  if (generated == null) throw new Error('응답 형식이 올바르지 않습니다.');
  return generated;
}
