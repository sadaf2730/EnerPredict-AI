import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRight,
  IndianRupee,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Minus,
} from 'lucide-react';

const OutlookCard = ({
  beforePrediction = {},
  afterPrediction = {},
  comparison = {},
  facilityTariff = 8.0,
}) => {
  const beforeKwh = Number(beforePrediction.predictedDailyConsumptionKwh || 0);
  const afterKwh = Number(afterPrediction.predictedDailyConsumptionKwh || 0);
  const kwhDiff = comparison.dailyConsumptionDiff ?? Number((afterKwh - beforeKwh).toFixed(2));
  const kwhPct = comparison.dailyConsumptionPct ?? (beforeKwh > 0 ? Number((((afterKwh - beforeKwh) / beforeKwh) * 100).toFixed(1)) : 0);

  const beforeKw = Number(beforePrediction.predictedDemandKw || 0);
  const afterKw = Number(afterPrediction.predictedDemandKw || 0);
  const kwDiff = comparison.demandDiff ?? Number((afterKw - beforeKw).toFixed(2));
  const kwPct = comparison.demandPct ?? (beforeKw > 0 ? Number((((afterKw - beforeKw) / beforeKw) * 100).toFixed(1)) : 0);

  const beforeCost = Number(beforePrediction.estimatedMonthlyCost || 0);
  const afterCost = Number(afterPrediction.estimatedMonthlyCost || 0);
  const costDiff = comparison.monthlyCostDiff ?? Number((afterCost - beforeCost).toFixed(2));
  const costPct = comparison.monthlyCostPct ?? (beforeCost > 0 ? Number((((afterCost - beforeCost) / beforeCost) * 100).toFixed(1)) : 0);

  const savings = comparison.potentialMonthlySavings ?? (costDiff < 0 ? Math.abs(costDiff) : 0);
  const isReduced = costDiff < 0 || kwhDiff < 0;
  const isIncreased = costDiff > 0 || kwhDiff > 0;
  const isNeutral = Math.abs(kwhDiff) < 0.05 && Math.abs(costDiff) < 1;

  const peakBefore = beforePrediction.predictedPeakWindow || 'N/A';
  const peakAfter = afterPrediction.predictedPeakWindow || 'N/A';
  const peakWindowChanged = peakBefore !== peakAfter && peakBefore !== 'N/A' && peakAfter !== 'N/A';

  const riskBefore = beforePrediction.peakRisk || 'Low';
  const riskAfter = afterPrediction.peakRisk || 'Low';

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High':
        return '#f87171';
      case 'Medium':
        return '#fbbf24';
      default:
        return 'var(--primary)';
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        transition: 'var(--theme-transition)',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)' }}>
            Machine Learning Simulation Output
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 0 0' }}>
            YOUR ENERGY OUTLOOK
          </h2>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: isReduced
              ? 'rgba(16, 185, 129, 0.15)'
              : isIncreased
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(14, 165, 233, 0.15)',
            border: `1px solid ${
              isReduced
                ? 'rgba(16, 185, 129, 0.35)'
                : isIncreased
                ? 'rgba(239, 68, 68, 0.35)'
                : 'rgba(14, 165, 233, 0.35)'
            }`,
            color: isReduced ? 'var(--primary)' : isIncreased ? '#f87171' : '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: '700',
          }}
        >
          {isReduced ? (
            <>
              <TrendingDown size={16} />
              <span>{Math.abs(kwhPct).toFixed(1)}% Demand Reduction</span>
            </>
          ) : isIncreased ? (
            <>
              <TrendingUp size={16} />
              <span>+{Math.abs(kwhPct).toFixed(1)}% Demand Increase</span>
            </>
          ) : (
            <>
              <Minus size={16} />
              <span>Balanced Demand</span>
            </>
          )}
        </div>
      </div>

      {/* Grid of 4 Comparison Metric Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Metric 1: Daily Consumption */}
        <div
          style={{
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
            borderRadius: '12px',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Zap size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Daily Consumption
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Current</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                {beforeKwh.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '3px' }}>kWh</span>
            </div>

            <ArrowRight size={18} color="var(--text-dim)" />

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'block', fontWeight: '600' }}>What-If</span>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  color: isReduced ? 'var(--primary)' : isIncreased ? '#f87171' : 'var(--text-heading)',
                  fontFamily: 'monospace',
                }}
              >
                {afterKwh.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '3px' }}>kWh</span>
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: '600' }}>
            <span style={{ color: kwhDiff <= 0 ? 'var(--primary)' : '#f87171' }}>
              {kwhDiff <= 0 ? '' : '+'}{kwhDiff.toFixed(1)} kWh ({kwhPct <= 0 ? '' : '+'}{kwhPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Metric 2: Peak Power Demand */}
        <div
          style={{
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
            borderRadius: '12px',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Activity size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Peak Electrical Demand
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Current</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                {beforeKw.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '3px' }}>kW</span>
            </div>

            <ArrowRight size={18} color="var(--text-dim)" />

            <div>
              <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', fontWeight: '600' }}>What-If</span>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  color: kwDiff <= 0 ? 'var(--primary)' : '#f87171',
                  fontFamily: 'monospace',
                }}
              >
                {afterKw.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '3px' }}>kW</span>
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: '600' }}>
            <span style={{ color: kwDiff <= 0 ? 'var(--primary)' : '#f87171' }}>
              {kwDiff <= 0 ? '' : '+'}{kwDiff.toFixed(1)} kW ({kwPct <= 0 ? '' : '+'}{kwPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Metric 3: Monthly Cost */}
        <div
          style={{
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
            borderRadius: '12px',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <IndianRupee size={16} color="#0ea5e9" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Monthly Bill Projection
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Current</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                ₹{Math.round(beforeCost).toLocaleString('en-IN')}
              </span>
            </div>

            <ArrowRight size={18} color="var(--text-dim)" />

            <div>
              <span style={{ fontSize: '0.72rem', color: '#0ea5e9', display: 'block', fontWeight: '600' }}>What-If</span>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  color: costDiff <= 0 ? 'var(--primary)' : '#f87171',
                  fontFamily: 'monospace',
                }}
              >
                ₹{Math.round(afterCost).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: '600' }}>
            <span style={{ color: costDiff <= 0 ? 'var(--primary)' : '#f87171' }}>
              {costDiff <= 0 ? '-' : '+'}₹{Math.abs(Math.round(costDiff)).toLocaleString('en-IN')} / mo ({costPct <= 0 ? '' : '+'}{costPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Metric 4: Peak Risk Level */}
        <div
          style={{
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
            borderRadius: '12px',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <AlertCircle size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Peak Grid Stress Risk
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Current</span>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: getRiskColor(riskBefore) }}>
                {riskBefore}
              </span>
            </div>

            <ArrowRight size={18} color="var(--text-dim)" />

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>What-If</span>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', color: getRiskColor(riskAfter) }}>
                {riskAfter}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {riskBefore !== riskAfter ? (
              <span style={{ color: riskAfter === 'Low' ? 'var(--primary)' : '#fbbf24', fontWeight: '600' }}>
                Risk shifted from {riskBefore} to {riskAfter}
              </span>
            ) : (
              <span>Risk classification remains {riskAfter}</span>
            )}
          </div>
        </div>
      </div>

      {/* Potential Monthly Savings Callout Banner */}
      {savings > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'var(--primary-bg-subtle)',
            border: '1px solid var(--primary-border-subtle)',
            boxShadow: '0 0 20px var(--primary-glow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <IndianRupee size={22} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Estimated Potential Saving
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                ₹{Math.round(savings).toLocaleString('en-IN')}{' '}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ month</span>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', display: 'block', fontWeight: '500' }}>
              Estimated reduction in predicted consumption:{' '}
              <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{Math.abs(kwhPct).toFixed(1)}%</strong>
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Based on trained model inference across 30 operational days
            </span>
          </div>
        </div>
      ) : isIncreased ? (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '500' }}>
            This scenario does not reduce the estimated monthly cost. Operating under these modified parameters is predicted to add approximately{' '}
            <strong>+₹{Math.round(Math.abs(costDiff)).toLocaleString('en-IN')} / month</strong>.
          </span>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'var(--bg-card-inner)',
            border: '1px solid var(--border-inner)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          No significant cost delta detected for this parameter adjustment.
        </div>
      )}

      {/* Peak Window Comparison Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-inner)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--accent-indigo)" />
          <span style={{ fontSize: '0.84rem', color: 'var(--text-heading)', fontWeight: '600' }}>
            Critical Peak Window:
          </span>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Current [{peakBefore}] → What-If [{peakAfter}]
          </span>
        </div>

        <span style={{ fontSize: '0.8rem', color: peakWindowChanged ? '#fbbf24' : 'var(--text-muted)', fontStyle: 'italic' }}>
          {peakWindowChanged
            ? `Peak window shifted from ${peakBefore} to ${peakAfter}`
            : 'Peak window remains similar under this scenario.'}
        </span>
      </div>
    </div>
  );
};

export default OutlookCard;
