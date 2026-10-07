import { useState } from 'react';
import { Card, Field } from '@/components/ui';
import { PRICES } from '@/domain/pricing';
import { chat } from '@/services/deepseek';
import { getApiKey, hasDevApiKey, setApiKey } from '@/storage/settings';

export function Settings({ onSaved }: { onSaved: () => void }) {
  const [key, setKey] = useState(getApiKey());
  const [msg, setMsg] = useState('');
  const [testing, setTesting] = useState(false);

  async function test() {
    setApiKey(key);
    setTesting(true);
    setMsg('');
    try {
      const r = await chat({ model: 'deepseek-flash', thinking: 'off', maxTokens: 20, messages: [{ role: 'user', content: '回复：好' }] });
      setMsg(`连接正常，模型回复「${r.content.trim()}」`);
      onSaved();
    } catch (e) {
      setMsg(`连接失败：${(e as Error).message}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">SETTINGS</div>
          <h1>设置</h1>
        </div>
      </div>
      <div className="grid g2">
        <Card title="DeepSeek 密钥" sub="浏览器直接调用 api.deepseek.com；密钥存在本机浏览器里">
          <div className="col">
            <Field label="API Key">
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." />
            </Field>
            <div className="row">
              <button className="btn primary" onClick={test} disabled={testing}>
                {testing ? <span className="spin" /> : null} 保存并测试
              </button>
              <button className="btn ghost" onClick={() => { setApiKey(''); setKey(getApiKey()); onSaved(); }}>
                {hasDevApiKey() ? '恢复为本机 .env 里的密钥' : '清除密钥'}
              </button>
            </div>
            {msg && <div className={`note ${msg.startsWith('连接正常') ? 'teal' : 'red'}`}>{msg}</div>}
            <p className="small muted">
              本机开发时，<code>npm run dev</code> 会读取被 gitignore 的 <code>.env</code> 里的 <code>DEEPSEEK_API_KEY</code> 作为默认密钥；构建出来的版本不带密钥。这里填写的会覆盖它，只保存在当前浏览器。
            </p>
          </div>
        </Card>
        <Card title="计价" sub="元 / 百万 tokens，高峰价；空闲时段半价">
          <table className="t">
            <thead>
              <tr><th>模型</th><th className="n">输入（缓存命中）</th><th className="n">输入（未命中）</th><th className="n">输出</th></tr>
            </thead>
            <tbody>
              {Object.entries(PRICES).map(([id, p]) => (
                <tr key={id}>
                  <td><b>{p.label}</b> <span className="muted small">{id}</span></td>
                  <td className="n">{p.hit}</td>
                  <td className="n">{p.miss}</td>
                  <td className="n">{p.out}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted mt8">
            每个人设的系统提示（规则 + 产品 + 输出格式）对同一次预测是相同的，放在最前面，所以大部分输入能命中缓存。花费按接口返回的实际用量计算。
          </p>
        </Card>
      </div>
    </div>
  );
}
