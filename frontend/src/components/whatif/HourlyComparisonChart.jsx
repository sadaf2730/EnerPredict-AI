import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceArea,
} from 'recharts';
import { TrendingDown, TrendingUp, Clock, Zap } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const baselineVal = payload.find((p) => p.dataKey === 'baseline')?.value;
    const whatIfVal = payload.find((p) => p.dataKey === 'whatif')?.value;
    const diff = (whatIfVal !== undefined && baselineVal !== undefined)
      ? Number((whatIfVal - baselineVal).toFixed(2))
      : null;

    return (
      <div
        style={{
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border-tooltip)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-dropdown)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: '500' }}>Current Baseline:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)' }}>{baselineVal} kW</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>What-If Scenario:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-heading)' }}>{whatIfVal} kW</span>
          </div>

          {diff !== null && (
            <div style={{ borderTop: '1px solid var(--border-inner)', paddingTop: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: diff <= 0 ? 'var(--primary)' : '#f87171', fontWeight: '700' }}>
                Difference: {diff <= 0 ? '' : '+'}{diff} kW
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const HourlyComparisonChart = ({
  beforeProfile = {},
  afterProfile = {},
  peakWindowBefore = '',
  peakWindowAfter = '',
}) => {
  // Combine both profiles into 24 data points
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const chartData = hours.map((hour) => {
    const baseline = typeof beforeProfile[hour] === 'number' ? Number(beforeProfile[hour].toFixed(2)) : 0;
    const whatif = typeof afterProfile[hour] === 'number' ? Number(afterProfile[hour].toFixed(2)) : 0;
    return {
      hour,
      baseline,
      whatif,
      delta: Number((whatif - baseline).toFixed(2)),
    };
  });

  return (
    <div
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        transition: 'var(--theme-transition)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Demand Profile Comparison (24-Hour Load Curve)
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Overlay of baseline predicted hourly draw (kW) against modified parameter simulation
          </p>
        </div>

        {/* Legend pills */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              fontSize: '0.78rem',
              color: '#0ea5e9',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
            <span>Baseline Profile</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'var(--primary-bg-subtle)',
              border: '1px solid var(--primary-border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--primary)',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
            <span>What-If Profile</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: '340px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--recharts-grid)" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="var(--recharts-axis)"
              tick={{ fontSize: 11, fill: 'var(--recharts-tick)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--recharts-axis)' }}
              interval={2}
            />
            <YAxis
              stroke="var(--recharts-axis)"
              tick={{ fontSize: 11, fill: 'var(--recharts-tick)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--recharts-axis)' }}
              unit=" kW"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Baseline Line */}
            <Line
              type="monotone"
              dataKey="baseline"
              name="Current Baseline"
              stroke="#0ea5e9"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5, fill: '#0ea5e9' }}
            />
            {/* What-If Line */}
            <Line
              type="monotone"
              dataKey="whatif"
              name="What-If Scenario"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--text-white)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Callout Insight */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-inner)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Clock size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Demand Curve Dynamics:</strong> Notice how the green curve adapts across the full 24-hour cycle. Lower peak amplitude directly corresponds to decreased demand charges and diminished grid stress during utility peak pricing bands.
        </span>
      </div>
    </div>
  );
};

export default HourlyComparisonChart;
