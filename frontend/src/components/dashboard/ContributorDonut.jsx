import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon, Info, Wind } from 'lucide-react';

const PALETTE = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border-tooltip)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-dropdown)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-heading)', display: 'block' }}>
          {data.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: data.color }}>
            {data.value}%
          </span>
          {data.kwh !== undefined && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({data.kwh} kWh/day)
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ContributorDonut = ({
  applianceBreakdown = {},
  totalDailyKwh = 0,
}) => {
  const percentageMap = applianceBreakdown.estimated_percentage_contributions || {};
  const kwhMap = applianceBreakdown.estimated_kwh_contributions || {};
  const acDetails = applianceBreakdown.ac_feature_details;

  // Convert to chart data array
  const chartData = Object.entries(percentageMap).map(([name, pct], idx) => ({
    name,
    value: typeof pct === 'number' ? Number(pct.toFixed(1)) : 0,
    kwh: kwhMap[name] !== undefined ? Number(kwhMap[name].toFixed(1)) : undefined,
    color: PALETTE[idx % PALETTE.length],
  }));

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
        justifyContent: 'space-between',
        gap: '1.25rem',
        transition: 'var(--theme-transition)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={20} color="#0ea5e9" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Estimated Energy Breakdown
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Estimated load contribution (based on equipment operational profiles)
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          No appliance breakdown available
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          {/* Donut Chart with Center Text */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut KPI */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  color: 'var(--text-heading)',
                  display: 'block',
                  lineHeight: 1.1,
                  fontFamily: 'monospace',
                }}
              >
                {totalDailyKwh.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                kWh / Day
              </span>
            </div>
          </div>

          {/* Breakdown Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chartData.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-inner)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '130px',
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.kwh !== undefined && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {item.kwh} kWh
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: item.color,
                      minWidth: '42px',
                      textAlign: 'right',
                    }}
                  >
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AC Combined Hours Intelligence Callout */}
      {acDetails && acDetails.ac_units > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
          }}
        >
          <Wind size={18} color="#0ea5e9" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: '600' }}>
              {acDetails.summary || `${acDetails.ac_units} AC units running ~${acDetails.ac_hours_per_day} hrs/day (${acDetails.combined_ac_hours} combined AC-hrs)`}
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Air-conditioning is a primary thermal driver affecting your daily demand curve.
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
        <Info size={14} color="var(--text-dim)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Modeled from dynamic appliance runtime coefficients and ambient temperatures.
        </span>
      </div>
    </div>
  );
};

export default ContributorDonut;
