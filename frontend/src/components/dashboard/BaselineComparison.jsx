import React from 'react';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

const BaselineComparison = ({
  estimatedDailyCost = 0,
  estimatedMonthlyCost = 0,
  predictedDailyKwh = 0,
  previousBill = 0,
  previousUnits = null,
  tariff = 8.0,
  facilityType = 'home',
}) => {
  // Estimated monthly units
  const predictedMonthlyUnits = predictedDailyKwh * 30;

  // If user provided previous bill, use that.
  // Otherwise, use facility standard benchmark for contextual comparison
  const defaultBenchmarks = {
    home: { bill: 3500, units: 450 },
    housing_society: { bill: 65000, units: 8000 },
    office: { bill: 95000, units: 11500 },
    college: { bill: 280000, units: 35000 },
    function_hall: { bill: 140000, units: 17500 },
  };

  const benchmark = defaultBenchmarks[facilityType] || { bill: 5000, units: 600 };
  const hasUserBaseline = previousBill > 0 || (previousUnits && previousUnits > 0);
  const baselineCost = previousBill > 0 ? previousBill : (previousUnits ? previousUnits * tariff : benchmark.bill);

  // Compute difference
  const costDiff = estimatedMonthlyCost - baselineCost;
  const pctDiff = baselineCost > 0 ? (costDiff / baselineCost) * 100 : 0;
  const isHigher = costDiff > 0;
  const isNeutral = Math.abs(pctDiff) < 5;

  const maxVal = Math.max(baselineCost, estimatedMonthlyCost, 1);
  const baselineWidth = Math.min(100, Math.round((baselineCost / maxVal) * 100));
  const predictedWidth = Math.min(100, Math.round((estimatedMonthlyCost / maxVal) * 100));

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
            <Scale size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Baseline Cost & Bill Comparison
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {hasUserBaseline
              ? 'Comparison against your submitted historical electricity bill'
              : `Comparison against regional benchmark for ${facilityType.replace('_', ' ')}`}
          </p>
        </div>

        {/* Delta Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: isNeutral
              ? 'rgba(14, 165, 233, 0.15)'
              : isHigher
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              isNeutral
                ? 'rgba(14, 165, 233, 0.3)'
                : isHigher
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(16, 185, 129, 0.3)'
            }`,
            color: isNeutral ? '#38bdf8' : isHigher ? '#f87171' : 'var(--primary)',
            fontSize: '0.78rem',
            fontWeight: '700',
          }}
        >
          {isNeutral ? (
            <CheckCircle2 size={14} />
          ) : isHigher ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          <span>
            {isNeutral
              ? 'On Par with Baseline'
              : `${Math.abs(pctDiff).toFixed(1)}% ${isHigher ? 'Higher' : 'Lower'}`}
          </span>
        </div>
      </div>

      {/* Main KPI figures side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Baseline Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            {hasUserBaseline ? 'Submitted Baseline' : 'Benchmark Baseline'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              ₹{baselineCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ month</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            {hasUserBaseline ? 'Based on last utility bill' : 'Standard sector baseline'}
          </span>
        </div>

        {/* Predicted Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--primary-bg-subtle)',
            border: '1px solid var(--primary-border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: '600' }}>
            ML Predicted Monthly Bill
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              ₹{estimatedMonthlyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ month</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', display: 'block' }}>
            ~₹{estimatedDailyCost.toFixed(1)} / day ({predictedMonthlyUnits.toFixed(0)} units/mo)
          </span>
        </div>
      </div>

      {/* Visual comparison bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Baseline Load</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>₹{baselineCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${baselineWidth}%`,
                height: '100%',
                background: 'var(--text-dim)',
                borderRadius: '4px',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>ML Predicted Load</span>
            <span style={{ color: isHigher ? '#f87171' : 'var(--primary)', fontWeight: '700' }}>
              ₹{estimatedMonthlyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${predictedWidth}%`,
                height: '100%',
                background: isHigher ? '#f87171' : '#10b981',
                borderRadius: '4px',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Rationale Callout */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-inner)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isHigher ? (
          <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
        ) : (
          <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
        )}
        <span>
          {isHigher
            ? `Your projected energy expenses exceed baseline by ₹${Math.abs(costDiff).toLocaleString('en-IN', { maximumFractionDigits: 0 })}. Check recommended actions below to trim unnecessary draw.`
            : `Your operational configuration is projected to save ~₹${Math.abs(costDiff).toLocaleString('en-IN', { maximumFractionDigits: 0 })} monthly compared to standard baselines.`}
        </span>
      </div>
    </div>
  );
};

export default BaselineComparison;
