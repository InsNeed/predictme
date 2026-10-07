import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export const PALETTE = ['#c8452c', '#2f6f73', '#b8892f', '#6b4f7a', '#4a463e', '#d98a6c', '#7fa9a5', '#a3392b', '#8a8376', '#3d7a4f'];

const THEME = {
  color: PALETTE,
  backgroundColor: 'transparent',
  textStyle: { fontFamily: "-apple-system, 'PingFang SC', sans-serif", color: '#4a463e' },
  title: { textStyle: { color: '#1d1b17' } },
  legend: { textStyle: { color: '#4a463e', fontSize: 11 }, itemWidth: 10, itemHeight: 10, icon: 'circle' },
  tooltip: {
    backgroundColor: '#1d1b17', borderColor: '#1d1b17', textStyle: { color: '#f4efe4', fontSize: 12 },
    extraCssText: 'border-radius:4px;box-shadow:none;',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#c9bfab' } }, axisTick: { show: false },
    axisLabel: { color: '#6f695d', fontSize: 11 }, splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#8a8376', fontSize: 11 }, splitLine: { lineStyle: { color: '#e6dfcf', type: 'dashed' } },
  },
  radar: { axisName: { color: '#4a463e' }, splitLine: { lineStyle: { color: '#e0d7c4' } }, splitArea: { show: false }, axisLine: { lineStyle: { color: '#e0d7c4' } } },
};
echarts.registerTheme('paper', THEME);

export function Chart({ option, height = 260, onClick }: { option: echarts.EChartsCoreOption; height?: number; onClick?: (p: any) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, 'paper', { renderer: 'canvas' });
    inst.current = c;
    c.on('click', (p) => clickRef.current?.(p));
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      c.dispose();
      inst.current = null;
    };
  }, []);

  useEffect(() => {
    inst.current?.setOption({ animationDuration: 400, grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true }, ...option }, true);
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
