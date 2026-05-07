import { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { arithmeticMeanULF, slsRatio, ulfToNm } from '../model';
import type { ControlState } from './Controls';

interface ChartsProps {
  state: ControlState;
  dark: boolean;
}

const SAMPLE_COUNT = 121; // 0..600 s in 5s-Schritten

export function Charts({ state, dark }: ChartsProps) {
  const data = useMemo(() => {
    const arr: Array<{ t: number; lengthNm: number; meanULF: number; r: number }> = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const t = (i / (SAMPLE_COUNT - 1)) * 600;
      const meanULF = arithmeticMeanULF(state, t);
      const r = slsRatio({ ...state, f: state.f }, t).r;
      arr.push({
        t,
        meanULF,
        lengthNm: ulfToNm(meanULF),
        r: isFinite(r) ? r : 0,
      });
    }
    return arr;
  }, [state]);

  const axis = dark ? '#7b8794' : '#7b8794';
  const grid = dark ? 'rgba(203,208,215,0.1)' : 'rgba(28,35,43,0.08)';
  const accent = '#0f766e';
  const accent2 = dark ? '#f59e0b' : '#b45309';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Mittlere Filamentlänge"
        subtitle="t · η-Skalierung (η = 0,89)"
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 22, left: 4 }}>
            <CartesianGrid stroke={grid} strokeDasharray="2 4" />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, 600]}
              ticks={[0, 60, 180, 300, 600]}
              tickFormatter={(v) =>
                v === 0 ? '0' : v === 60 ? '1 min' : v === 180 ? '3' : v === 300 ? '5' : '10'
              }
              stroke={axis}
              tick={{ fill: axis, fontSize: 11 }}
              label={{
                value: 'Zeit [min]',
                position: 'insideBottom',
                offset: -10,
                fill: axis,
                fontSize: 11,
              }}
            />
            <YAxis
              stroke={axis}
              tick={{ fill: axis, fontSize: 11 }}
              label={{
                value: 'Länge [nm]',
                angle: -90,
                position: 'insideLeft',
                fill: axis,
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: dark ? '#1c232b' : '#fbf8f2',
                border: '1px solid ' + (dark ? '#3e4852' : '#ebe3d2'),
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(v) => `t = ${Number(v).toFixed(0)} s`}
              formatter={(value: number, name) => {
                if (name === 'lengthNm')
                  return [`${value.toFixed(0)} nm (${(value / 1000).toFixed(2)} µm)`, 'Länge'];
                return [value.toFixed(2), name];
              }}
            />
            <ReferenceLine x={60} stroke={grid} strokeDasharray="2 4" />
            <ReferenceLine x={300} stroke={grid} strokeDasharray="2 4" />
            <Line
              type="monotone"
              dataKey="lengthNm"
              stroke={accent}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="SLS-Intensitätsverhältnis"
        subtitle="r(t) = 1 + (p − 1)(1 − e^(−t/τ))"
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 22, left: 4 }}>
            <CartesianGrid stroke={grid} strokeDasharray="2 4" />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, 600]}
              ticks={[0, 60, 180, 300, 600]}
              tickFormatter={(v) =>
                v === 0 ? '0' : v === 60 ? '1' : v === 180 ? '3' : v === 300 ? '5' : '10'
              }
              stroke={axis}
              tick={{ fill: axis, fontSize: 11 }}
              label={{
                value: 'Zeit [min]',
                position: 'insideBottom',
                offset: -10,
                fill: axis,
                fontSize: 11,
              }}
            />
            <YAxis
              stroke={axis}
              tick={{ fill: axis, fontSize: 11 }}
              label={{
                value: 'r',
                angle: -90,
                position: 'insideLeft',
                fill: axis,
                fontSize: 11,
              }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: dark ? '#1c232b' : '#fbf8f2',
                border: '1px solid ' + (dark ? '#3e4852' : '#ebe3d2'),
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(v) => `t = ${Number(v).toFixed(0)} s`}
              formatter={(value: number) => [value.toFixed(3), 'r']}
            />
            <Line
              type="monotone"
              dataKey="r"
              stroke={accent2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800/60 p-4 shadow-panel">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</h4>
        <span className="text-[11px] font-mono text-ink-400 dark:text-ink-200/70">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
