import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Zap, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Clock, 
  IndianRupee, TrendingUp, CheckCircle, Info, Sparkles 
} from 'lucide-react';

const PredictionResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const prediction = location.state?.prediction;
  const facility = location.state?.facility;

  if (!prediction) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '5rem auto',
        padding: '2rem',
        textAlign: 'center',
      }} className="glass-panel">
        <AlertTriangle size={48} color="var(--accent-amber)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-heading)' }}>No Active Prediction Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please select a facility and submit your operational inputs first.
        </p>
        <button
          onClick={() => navigate('/facilities')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: '600',
          }}
        >
          Select Facility
        </button>
      </div>
    );
  }

  const riskClass = (prediction.peakRisk || 'low').toLowerCase();

  return (
    <div style={{
      maxWidth: '1050px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem 5rem',
    }}>
      {/* Top Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          <ArrowLeft size={16} />
          <span>Adjust Operational Inputs</span>
        </button>

        <button
          onClick={() => navigate('/facilities')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card-inner)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.88rem',
            fontWeight: '600',
          }}
        >
          <RefreshCw size={15} />
          <span>Switch Facility</span>
        </button>
      </div>

      {/* Success Hero Banner */}
      <div className="glass-panel animate-fade-in" style={{
        padding: '2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em' }}>
              ML PREDICTION GENERATED FROM YOUR INPUTS
            </span>
            <h1 style={{ fontSize: '1.7rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-heading)' }}>
              Personalized Energy & Peak Forecast
            </h1>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '0.5rem' }}>
          AI Forecast Engine: <strong style={{ color: 'var(--text-heading)' }}>Trained Predictive Model</strong> • Output dynamically calculated from your facility parameters.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* KPI 1: Daily Energy */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Estimated Daily Consumption
            </span>
            <Zap size={18} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              {prediction.predictedDailyConsumptionKwh}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '600' }}>kWh</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            24-hour aggregate operational load
          </span>
        </div>

        {/* KPI 2: Peak Demand */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Expected Peak Demand
            </span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              {prediction.predictedDemandKw}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>kW</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            Maximum simultaneous draw
          </span>
        </div>

        {/* KPI 3: Peak Risk */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Peak-Demand Risk
            </span>
            <ShieldCheck size={18} color={riskClass === 'high' ? 'var(--accent-rose)' : (riskClass === 'medium' ? 'var(--accent-amber)' : 'var(--primary)')} />
          </div>
          <div style={{ margin: '6px 0 8px' }}>
            <span className={`badge-risk ${riskClass}`}>
              {riskClass === 'high' && '🔴'}
              {riskClass === 'medium' && '🟡'}
              {riskClass === 'low' && '🟢'}
              {prediction.peakRisk} Peak Risk
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block' }}>
            Relative to facility baseline capacity
          </span>
        </div>

        {/* KPI 4: Peak Window */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Predicted Peak Window
            </span>
            <Clock size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0' }}>
            {prediction.predictedPeakWindow || '13:00 - 16:00'}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block' }}>
            Derived from 24-hr load curve
          </span>
        </div>
      </div>

      {/* Secondary Row: Cost Estimates & Appliance Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Cost Projections */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <IndianRupee size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)' }}>Estimated Electricity Costs</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-inner)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Estimated Daily Cost</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-heading)' }}>₹{prediction.estimatedDailyCost?.toLocaleString()}</strong>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-bg-subtle)',
              border: '1px solid var(--primary-border-subtle)',
            }}>
              <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Estimated Monthly Cost</span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--primary)', fontWeight: '800' }}>
                ₹{prediction.estimatedMonthlyCost?.toLocaleString()}
              </strong>
            </div>
          </div>

          <p style={{
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            marginTop: '1rem',
            fontStyle: 'italic',
          }}>
            * Estimated costs are projections based on standard ₹8.5/kWh tariff assumptions. Actual billing depends on progressive slab tiers and utility fuel surcharges.
          </p>
        </div>

        {/* Appliance Contribution Breakdown */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)' }}>Energy Contributor Analysis</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Estimated Contribution</span>
          </div>

          {/* Breakdown bars */}
          {prediction.applianceBreakdown?.estimated_percentage_contributions ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(prediction.applianceBreakdown.estimated_percentage_contributions).map(([name, pct]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{name}</span>
                    <strong style={{ color: 'var(--text-heading)' }}>{pct}%</strong>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                      borderRadius: 'var(--radius-full)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Contributor analysis available in Phase 4 dashboard.</p>
          )}

          {/* AC combined hours explanation */}
          {prediction.applianceBreakdown?.ac_feature_details && (
            <div style={{
              marginTop: '1.25rem',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
            }}>
              <strong>❄️ AC Usage Insight:</strong> {prediction.applianceBreakdown.ac_feature_details.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;
