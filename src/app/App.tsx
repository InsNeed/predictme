import { useEffect, useState } from 'react';
import { isPeakNow } from '@/domain/pricing';
import { fetchBalance } from '@/services/deepseek';
import { getApiKey } from '@/storage/settings';
import { History } from '@/pages/History';
import { Method } from '@/pages/Method';
import { NewRun } from '@/pages/NewRun';
import { RunView } from '@/pages/run/RunView';
import { Settings } from '@/pages/Settings';
import { useHashRoute } from './router';

export function App() {
  const route = useHashRoute();
  const [balance, setBalance] = useState<string | null>(null);
  useEffect(() => {
    fetchBalance().then(setBalance);
    const t = window.setInterval(() => fetchBalance().then(setBalance), 60000);
    return () => window.clearInterval(t);
  }, []);
  const page = route[0] ?? 'new';
  let body;
  if (page === 'run' && route[1]) body = <RunView id={route[1]} />;
  else if (page === 'history') body = <History />;
  else if (page === 'method') body = <Method />;
  else if (page === 'settings') body = <Settings onSaved={() => fetchBalance().then(setBalance)} />;
  else body = <NewRun />;
  const peak = isPeakNow();
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="brand-mark">群</div>
          <div>
            <div className="brand-name">群像实验室</div>
            <div className="brand-sub">PREDICT ME · CROWD LAB</div>
          </div>
        </div>
        <nav className="nav">
          <a href="#/new" className={page === 'new' || page === '' ? 'on' : ''}>＋ 新建预测</a>
          <a href="#/history" className={page === 'history' || page === 'run' ? 'on' : ''}>☰ 预测记录</a>
          <span className="sec">了解</span>
          <a href="#/method" className={page === 'method' ? 'on' : ''}>§ 方法与局限</a>
          <a href="#/settings" className={page === 'settings' ? 'on' : ''}>⚙ 设置</a>
        </nav>
        <div className="side-foot">
          <span>
            DeepSeek 余额 <b className="num">{balance ?? (getApiKey() ? '…' : '未设置密钥')}</b>
          </span>
          <span>
            {peak ? '● 现在是高峰时段（全价）' : '○ 现在是空闲时段（半价）'}
          </span>
          <span className="tiny">北京时间工作日 9–12、14–18 点为高峰</span>
        </div>
      </aside>
      <main className="main">{body}</main>
    </div>
  );
}
