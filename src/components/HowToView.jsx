import React, { useState } from 'react';
import { Copy, Cloud, Settings, Home } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const WRANGLER_SECRET_CMD = 'npx wrangler secret put MASTER_TOKEN';
const REPO_CLONE_URL = 'https://github.com/explainpark101/test-paper.git';
const BRANCH_NAME = 'cloudflare-worker';

const PRE_KV_CREATE = 'npx wrangler kv namespace create KV';
const PRE_CLONE = `git clone -b ${BRANCH_NAME} ${REPO_CLONE_URL}\ncd test-paper\nnpm i`;
const PRE_KV_JSON = `"kv_namespaces": [
  {
    "binding": "KV",
    "id": "여기에_본인_KV_네임스페이스_ID"
  }
],`;
const PRE_DEPLOY = 'npm run deploy';

export default function HowToView({ masterTokenStorageKey, onMasterTokenGenerated, setView, navigate }) {
  const [generatedToken, setGeneratedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSecretCmd, setCopiedSecretCmd] = useState(false);
  const [copiedPreKey, setCopiedPreKey] = useState(null);
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false);

  const handleCopyPre = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPreKey(key);
      setTimeout(() => setCopiedPreKey(null), 2000);
    } catch (_) {}
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    setGeneratedToken(s);
  };

  const applyTokenToStorage = () => {
    if (!generatedToken || !masterTokenStorageKey) return;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(masterTokenStorageKey, generatedToken);
      onMasterTokenGenerated?.(generatedToken);
    }
    setOverwriteConfirmOpen(false);
  };

  const handleSetAsMyToken = () => {
    if (!generatedToken || !masterTokenStorageKey) return;
    const existing = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(masterTokenStorageKey) : null;
    if (existing != null && existing !== '') {
      setOverwriteConfirmOpen(true);
    } else {
      applyTokenToStorage();
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (_) {}
  };

  const handleCopySecretCmd = async () => {
    try {
      await navigator.clipboard.writeText(WRANGLER_SECRET_CMD);
      setCopiedSecretCmd(true);
      setTimeout(() => setCopiedSecretCmd(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
          <Cloud className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Cloudflare Worker 배포 방법
        </h2>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">1. KV 네임스페이스 생성</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Workers KV는 키-값 저장소로, Cloudflare의 글로벌 네트워크에 복제됩니다. 아래 두 가지 방법 중 하나로 KV 네임스페이스를 만드세요.
          </p>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 mb-1">방법 A — Wrangler CLI</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            터미널에서 다음을 실행합니다. <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">&lt;바인딩_이름&gt;</code>에는 Worker 코드에서 사용할 이름(예: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">KV</code>)을 넣습니다.
          </p>
          <div className="flex items-stretch gap-2 mb-2">
            <pre className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 border border-gray-200 dark:border-gray-600">{PRE_KV_CREATE}</pre>
            <button type="button" onClick={() => handleCopyPre(PRE_KV_CREATE, 'kv-create')} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1" title="복사">
              <Copy className="w-4 h-4" /> {copiedPreKey === 'kv-create' ? '복사됨' : '복사'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            실행 후 터미널에 출력되는 <strong>id</strong> 값을 복사해 두세요. 2단계에서 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">wrangler.jsonc</code>에 넣습니다.
          </p>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 mb-1">방법 B — Cloudflare 대시보드</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <a href="https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">Workers KV 페이지</a>로 이동 → <strong>Create instance</strong> → 네임스페이스 이름 입력(예: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">exam-papers</code>) → <strong>Create</strong>. 생성된 네임스페이스의 <strong>ID</strong>를 복사해 두세요.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. 저장소 clone 및 KV 바인딩 설정</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>cloudflare-worker</strong> 브랜치를 clone한 뒤, 프로젝트에서 KV 네임스페이스를 사용하도록 바인딩합니다.
          </p>
          <div className="flex items-stretch gap-2 mb-2">
            <pre className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 border border-gray-200 dark:border-gray-600 overflow-x-auto">{PRE_CLONE}</pre>
            <button type="button" onClick={() => handleCopyPre(PRE_CLONE, 'clone')} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1" title="복사">
              <Copy className="w-4 h-4" /> {copiedPreKey === 'clone' ? '복사됨' : '복사'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">wrangler.jsonc</code>를 열어 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">kv_namespaces[0].id</code>를 1단계에서 복사한 <strong>본인 KV 네임스페이스 ID</strong>로 바꿉니다. <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">binding</code>은 Worker 코드에서 참조하는 이름(예: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">KV</code>)이면 됩니다.
          </p>
          <div className="flex items-stretch gap-2 mb-2">
            <pre className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 border border-gray-200 dark:border-gray-600 overflow-x-auto">{PRE_KV_JSON}</pre>
            <button type="button" onClick={() => handleCopyPre(PRE_KV_JSON, 'json')} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1" title="복사">
              <Copy className="w-4 h-4" /> {copiedPreKey === 'json' ? '복사됨' : '복사'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            바인딩은 Worker가 KV 네임스페이스에 접근할 수 있게 하는 런타임 변수입니다. 자세한 내용은 <a href="https://developers.cloudflare.com/kv/get-started/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">Cloudflare KV 시작하기</a>를 참고하세요.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">3. MASTER_TOKEN 시크릿 설정</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            클라이언트는 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Authorization: Bearer &lt;MASTER_TOKEN&gt;</code>으로 인증합니다. 아래 4단계에서 토큰을 생성한 뒤, 같은 값을 Worker 시크릿으로 등록하세요. 다른 기기/앱에서도 동일한 MASTER_TOKEN을 사용해야 합니다.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2">{WRANGLER_SECRET_CMD}</code>
            <button type="button" onClick={handleCopySecretCmd} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1">
              <Copy className="w-4 h-4" /> {copiedSecretCmd ? '복사됨' : '명령어 복사'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            프로젝트 루트(<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">test-paper</code>)에서 위 명령을 실행하면 프롬프트가 나옵니다. 4단계에서 생성한 토큰 문자열을 붙여넣으면 됩니다.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">4. MASTER_TOKEN 생성</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            아래 버튼으로 랜덤 MASTER_TOKEN을 생성하세요. <strong>내 MASTER_TOKEN으로 설정</strong>을 누르면 이 기기의 sessionStorage에 저장되며, 위 3단계 시크릿 명령과 앱 설정에 동일한 값을 사용하세요. <strong>다른 기기에서도 동일한 MASTER_TOKEN을 설정해야 인증이 됩니다.</strong>
          </p>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <button type="button" onClick={generateRandomToken} className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm">
              MASTER_TOKEN 생성
            </button>
            {generatedToken && (
              <>
                <code className="flex-1 min-w-0 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 truncate">{generatedToken}</code>
                <button type="button" onClick={handleCopyToken} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1">
                  <Copy className="w-4 h-4" /> {copiedToken ? '복사됨' : '복사'}
                </button>
                <button type="button" onClick={handleSetAsMyToken} className="shrink-0 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm font-medium">
                  내 MASTER_TOKEN으로 설정
                </button>
              </>
            )}
          </div>
          {generatedToken && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              위 값으로 설정하려면 <strong>내 MASTER_TOKEN으로 설정</strong>을 누르세요. 3단계 명령어를 복사해 터미널에서 실행한 뒤 이 값을 입력하고, 설정 페이지에서 Worker URL과 함께 사용할 수 있습니다.
            </p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">5. 배포</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            KV ID와 MASTER_TOKEN 시크릿 설정이 끝났다면, 같은 프로젝트 루트에서 배포합니다.
          </p>
          <div className="flex items-stretch gap-2">
            <pre className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 border border-gray-200 dark:border-gray-600">{PRE_DEPLOY}</pre>
            <button type="button" onClick={() => handleCopyPre(PRE_DEPLOY, 'deploy')} className="shrink-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1" title="복사">
              <Copy className="w-4 h-4" /> {copiedPreKey === 'deploy' ? '복사됨' : '복사'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            배포가 완료되면 터미널에 Worker URL이 출력됩니다(예: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://kv.xxx.workers.dev</code>). 앱 설정의 <strong>Worker URL</strong>에 이 주소를, <strong>MASTER_TOKEN</strong>에는 위에서 설정한 값과 동일한 문자열을 넣으면 됩니다.
          </p>
        </section>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          요약: KV 네임스페이스 생성 → <a href="https://github.com/explainpark101/test-paper/tree/cloudflare-worker" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">cloudflare-worker</a> 브랜치 clone 후 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">wrangler.jsonc</code>에 KV ID 설정 → <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npx wrangler secret put MASTER_TOKEN</code>으로 시크릿 설정 → MASTER_TOKEN 생성 후 복사·입력 → <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npm run deploy</code>.
        </p>
      </div>
      <div className="flex gap-4">
        <button type="button" onClick={() => { setView('settings'); navigate('?view=settings'); }} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          <Settings className="w-4 h-4" /> 설정으로
        </button>
        <button type="button" onClick={() => { setView('home'); navigate('/?'); }} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          <Home className="w-4 h-4" /> 홈으로
        </button>
      </div>

      <ConfirmModal
        isOpen={overwriteConfirmOpen}
        onClose={() => setOverwriteConfirmOpen(false)}
        onConfirm={applyTokenToStorage}
        title="기존 MASTER_TOKEN이 있습니다"
        message="이미 저장된 MASTER_TOKEN이 있습니다. 적용하면 기존 값이 지워지고 위에서 생성한 값으로 대체됩니다. 계속하시겠습니까?"
        confirmText="적용"
        cancelText="취소"
        type="warning"
      />
    </div>
  );
}
