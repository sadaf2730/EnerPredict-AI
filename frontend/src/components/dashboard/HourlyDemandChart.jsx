import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Zap, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, peakWindow }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
          {data.isPeak && (
            <span
              style={{
                fontSize: '0.7rem',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: '700',
              }}
            >
              PEAK HOUR
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
            {data.demand}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kW</span>
        </div>
      </div>
    );
  }
  return null;
};

const HourlyDemandChart = ({ hourlyProfile = {}, predictedPeakWindow = '', maxDemandKw = 0 }) => {
  // Parse peak start and end hours from string e.g. "14:00 - 18:00"
  let peakStart = -1;
  let peakEnd = -1;
  if (predictedPeakWindow && predictedPeakWindow.includes('-')) {
    const parts = predictedPeakWindow.split('-').map((s) => s.trim());
    if (parts[0]) peakStart = parseInt(parts[0].split(':')[0], 10);
    if (parts[1]) peakEnd = parseInt(parts[1].split(':')[0], 10);
  }

  // Convert dictionary { "00:00": 1.2, ... } to sorted array
  const chartData = Object.entries(hourlyProfile || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, val]) => {
      const h = parseInt(hour.split(':')[0], 10);
      const isPeak =
        peakStart !== -1 && peakEnd !== -1
          ? peakStart <= peakEnd
            ? h >= peakStart && h <= peakEnd
            : h >= peakStart || h <= peakEnd
          : false;

      return {
        hour,
        demand: typeof val === 'number' ? Number(val.toFixed(2)) : 0,
        isPeak,
      };
    });

  // Calculate stats
  const demandValues = chartData.map((d) => d.demand);
  const minDemand = demandValues.length ? Math.min(...demandValues) : 0;
  const avgDemand = demandValues.length
    ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length
    : 0;
  const peakVal = demandValues.length ? Math.max(...demandValues) : maxDemandKw;

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
      {/* Header & Quick Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              24-Hour Predictive Demand Curve
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Simulated hourly power profile (kW) predicted by the trained ML model across typical 24 hours
          </p>
        </div>

        {/* Quick stat badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>
              Peak Window
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)' }}>
              {predictedPeakWindow || 'N/A'}
            </span>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--primary-bg-subtle)',
              border: '1px solid var(--primary-border-subtle)',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>
              Avg Load
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)' }}>
              {avgDemand.toFixed(1)} kW
            </span>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: '600', textTransform: 'uppercase' }}>
              Baseload
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)' }}>
              {minDemand.toFixed(1)} kW
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: '320px', position: 'relative' }}>
        {chartData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No hourly profile available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomTooltip peakWindow={predictedPeakWindow} />} />
              <ReferenceLine
                y={peakVal}
                stroke="#f87171"
                strokeDasharray="4 4"
                label={{
                  value: `Peak: ${peakVal.toFixed(1)} kW`,
                  fill: '#f87171',
                  fontSize: 11,
                  position: 'top',
                }}
              />
              <Area
                type="monotone"
                dataKey="demand"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#energyGlow)"
                activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--text-white)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak Callout Notification Banner */}
      {predictedPeakWindow && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <div
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-heading)' }}>
              Critical Grid Window Alert: {predictedPeakWindow}
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Your facility reaches its highest electrical draw ({peakVal.toFixed(1)} kW) during this window. Shifting loads out of this interval significantly reduces surcharge risks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HourlyDemandChart;
