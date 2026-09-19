import React from 'react';
import { History, Calendar, ArrowRight, Check, Zap, IndianRupee } from 'lucide-react';

const WhatIfHistory = ({
  scenarios = [],
  activeScenarioId = null,
  onSelectScenario,
}) => {
  if (!scenarios || scenarios.length === 0) {
    return null;
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recent Run';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to summarize what inputs changed
  const getModificationsSummary = (baseInput = {}, modifiedInput = {}) => {
    const changes = [];
    const keysToCheck = [
      { key: 'ac_units', label: 'AC' },
      { key: 'ac_hours', label: 'AC hrs' },
      { key: 'computers', label: 'PCs' },
      { key: 'computer_hours', label: 'PC hrs' },
      { key: 'pumps', label: 'Pumps' },
      { key: 'pump_hours', label: 'Pump hrs' },
      { key: 'ev_charging_hours', label: 'EV hrs' },
      { key: 'ev_usage_hours', label: 'EV hrs' },
      { key: 'lab_hours', label: 'Lab hrs' },
      { key: 'working_hours', label: 'Work hrs' },
      { key: 'temperature', label: 'Temp' },
    ];

    for (const item of keysToCheck) {
      if (
        modifiedInput[item.key] !== undefined &&
        baseInput[item.key] !== undefined &&
        Number(modifiedInput[item.key]) !== Number(baseInput[item.key])
      ) {
        changes.push(`${item.label}: ${baseInput[item.key]} → ${modifiedInput[item.key]}`);
      }
    }

    return changes.length > 0 ? changes.slice(0, 3).join(', ') : 'Parameter adjustment';
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--accent-indigo)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
            Previous What-If Scenarios
          </h3>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--accent-indigo)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: '600',
          }}
        >
          {scenarios.length} Simulation{scenarios.length > 1 ? 's' : ''} Stored
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {scenarios.map((s) => {
          const isSelected = s._id === activeScenarioId;
          const beforeKwh = s.beforePrediction?.predictedDailyConsumptionKwh || 0;
          const afterKwh = s.afterPrediction?.predictedDailyConsumptionKwh || 0;
          const kwhDiff = afterKwh - beforeKwh;
          const kwhPct = beforeKwh > 0 ? ((kwhDiff / beforeKwh) * 100).toFixed(1) : 0;
          const summary = getModificationsSummary(s.baseInput, s.modifiedInput);

          return (
            <div
              key={s._id}
              onClick={() => onSelectScenario && onSelectScenario(s)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: isSelected
                  ? 'var(--primary-bg-subtle)'
                  : 'var(--bg-card-inner)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-inner)',
                boxShadow: isSelected ? '0 0 15px var(--primary-glow)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-inner)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {formatTimestamp(s.createdAt)}
                  </span>
                </div>

                {isSelected && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: 'var(--primary)',
                    }}
                  >
                    <Check size={12} /> Viewing
                  </span>
                )}
              </div>

              {/* Summary of changed fields */}
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-heading)',
                  marginBottom: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={summary}
              >
                {summary}
              </div>

              {/* Before vs After and Delta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {beforeKwh.toFixed(1)}
                  </span>
                  <ArrowRight size={14} color="var(--text-dim)" />
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                    {afterKwh.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>kWh</span>
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: kwhDiff <= 0 ? 'var(--primary)' : '#f87171',
                    background: kwhDiff <= 0 ? 'var(--primary-bg-subtle)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {kwhDiff <= 0 ? '' : '+'}{kwhPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WhatIfHistory;
