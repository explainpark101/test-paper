const MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT_PREFIX = {
  bullet:
    '아래 내용을 외우기 좋은 형태의 단조체, bullet point 형태로 변환해 주세요. 다른 설명 없이 변환 결과만 출력하세요.\n\n',
  narrative:
    '아래 내용을 더 자세한 부연설명이 포함된 서술체로 다시 작성해 주세요. 다른 설명 없이 작성 결과만 출력하세요.\n\n'
};

/**
 * @param {string} apiKey
 * @param {'bullet'|'narrative'} promptType
 * @param {string} text
 * @returns {Promise<string>} generated text
 */
export async function generateMemoContent(apiKey, promptType, text) {
  const prefix = PROMPT_PREFIX[promptType] ?? PROMPT_PREFIX.bullet;
  const fullPrompt = prefix + (text || '').trim();
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
