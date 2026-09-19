import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/dashboard/MetricCard';
import HourlyDemandChart from '../components/dashboard/HourlyDemandChart';
import ContributorDonut from '../components/dashboard/ContributorDonut';
import BaselineComparison from '../components/dashboard/BaselineComparison';
import DynamicInsights from '../components/dashboard/DynamicInsights';
import RecommendationsList from '../components/dashboard/RecommendationsList';
import PredictionHistory from '../components/dashboard/PredictionHistory';
import { generateRecommendations } from '../utils/recommendationEngine';
import {
  Building2,
  Zap,
  Calendar,
  Clock,
  IndianRupee,
  Activity,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

const Dashboard = () => {
  const { facilityId, id } = useParams();
  const activeFacilityId = facilityId || id;
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [facility, setFacility] = useState(location.state?.facility || null);
  const [activePrediction, setActivePrediction] = useState(location.state?.prediction || null);
  const [history, setHistory] = useState([]);

  // Fetch facility & predictions
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      // 1. Fetch Facility Details if not already in state
      let currentFacility = facility;
      if (!currentFacility || currentFacility._id !== activeFacilityId) {
        const facRes = await apiClient.get(`/facilities/${activeFacilityId}`);
        currentFacility = facRes.data.facility;
        setFacility(currentFacility);
      }

      // 2. Fetch Prediction History for this facility
      const predRes = await apiClient.get(`/predictions/${activeFacilityId}`);
      const predictions = predRes.data.predictions || [];
      setHistory(predictions);

      // 3. Set Active Prediction
      // If we came from a fresh submission, keep that. Otherwise use newest from DB.
      if (!activePrediction && predictions.length > 0) {
        setActivePrediction(predictions[0]);
      } else if (activePrediction) {
        // Match up with updated history if possible
        const found = predictions.find((p) => p._id === activePrediction._id);
        if (found) setActivePrediction(found);
      } else if (predictions.length === 0) {
        // No predictions yet, redirect to input form
        navigate(`/facility/${activeFacilityId}/input`, { replace: true });
        return;
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(
        err.response?.data?.message || 'Unable to load facility dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeFacilityId) {
      loadDashboardData();
    }
  }, [activeFacilityId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <LoadingSpinner message="Synthesizing personalized energy intelligence..." />
      </div>
    );
  }

  if (error || !facility || !activePrediction) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div
          style={{
            padding: '2.5rem',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle size={48} color="#f87171" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>
            Dashboard Unavailable
          </h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error || 'No prediction results found for this facility.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => loadDashboardData(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Retry
            </button>
            <Link
              to="/facilities"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Back to Facilities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract raw input data from prediction or state
  const rawInput =
    activePrediction.energyInput?.inputData ||
    activePrediction.energyInputId?.inputData ||
    location.state?.inputPayload ||
    {};

  // Generate dynamic actionable recommendations
  const recommendations = generateRecommendations(
    facility.facilityType,
    { ...rawInput, tariff: facility.tariff },
    activePrediction
  );

  // Peak Risk Badge Styling
  const peakRisk = activePrediction.peakRisk || 'Low';
  const riskStyles = {
    High: { color: 'rose', glow: 'rgba(244, 63, 94, 0.25)', accent: '#f43f5e' },
    Medium: { color: 'amber', glow: 'rgba(245, 158, 11, 0.25)', accent: '#f59e0b' },
    Low: { color: 'emerald', glow: 'rgba(16, 185, 129, 0.25)', accent: '#10b981' },
  };
  const currentRisk = riskStyles[peakRisk] || riskStyles.Low;

  const formatFacilityTypeName = (type) => {
    switch (type) {
      case 'home':
        return 'Residential Home';
      case 'housing_society':
        return 'Housing Society / Apartment Complex';
      case 'office':
        return 'Commercial Office Building';
      case 'college':
        return 'Educational College Campus';
      case 'function_hall':
        return 'Event Venue & Function Hall';
      default:
        return type;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* SECTION A: HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {formatFacilityTypeName(facility.facilityType)}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Tariff: ₹{facility.tariff || 8}/kWh
            </span>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: 'var(--text-heading)',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px',
            }}
          >
            {facility.facilityName || facility.name}
          </h1>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Personalized Predictive Energy Intelligence Dashboard •{' '}
            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
              AI Forecast Engine Active
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to={`/facility/${facility._id}/input`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s ease',
            }}
          >
            <PlusCircle size={16} />
            <span>New Prediction Run</span>
          </Link>

          <Link
            to={`/what-if/${facility._id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              transition: 'transform 0.2s ease',
            }}
          >
            <Sparkles size={16} />
            <span>Try What-If Simulator</span>
          </Link>

          <Link
            to="/facilities"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Switch Facility</span>
          </Link>
        </div>
      </div>

      {/* SECTION B: CORE KPI METRIC CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Metric 1: Daily Energy Consumption */}
        <MetricCard
          title="Daily Energy Consumption"
          value={Number(activePrediction.predictedDailyConsumptionKwh).toFixed(1)}
          unit="kWh"
          subtitle={`~₹${(activePrediction.estimatedDailyCost || 0).toFixed(0)} / day estimated`}
          icon={Zap}
          badge="Predicted"
          badgeColor="emerald"
          accentColor="#10b981"
          glowColor="rgba(16, 185, 129, 0.2)"
        />

        {/* Metric 2: Peak Power Demand */}
        <MetricCard
          title="Peak Electrical Demand"
          value={Number(activePrediction.predictedDemandKw).toFixed(1)}
          unit="kW"
          subtitle="Simulated coincident max load"
          icon={Activity}
          badge={`${peakRisk} Risk`}
          badgeColor={currentRisk.color}
          accentColor={currentRisk.accent}
          glowColor={currentRisk.glow}
        />

        {/* Metric 3: Predicted Peak Window */}
        <MetricCard
          title="Critical Peak Window"
          value={activePrediction.predictedPeakWindow || '14:00 - 18:00'}
          subtitle="Highest consecutive draw interval"
          icon={Clock}
          badge="High Stress"
          badgeColor="rose"
          accentColor="#f43f5e"
          glowColor="rgba(244, 63, 94, 0.2)"
        />

        {/* Metric 4: Monthly Cost Projection */}
        <MetricCard
          title="Projected Monthly Bill"
          value={`₹${Math.round(activePrediction.estimatedMonthlyCost || 0).toLocaleString('en-IN')}`}
          subtitle={`@ ₹${facility.tariff || 8}/kWh base tariff`}
          icon={IndianRupee}
          badge="30-Day Extrapolation"
          badgeColor="sky"
          accentColor="#0ea5e9"
          glowColor="rgba(14, 165, 233, 0.2)"
        />
      </div>

      {/* FEATURE CALLOUT: WHAT-IF ENERGY SIMULATOR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '1.25rem 1.75rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.12)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
              What-If Energy Simulator
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '3px 0 0 0' }}>
              Simulate operational parameter modifications and evaluate real-time ML before-vs-after predictions.
            </p>
          </div>
        </div>

        <Link
          to={`/what-if/${facility._id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            fontSize: '0.92rem',
            fontWeight: '700',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s ease',
          }}
        >
          <span>Launch Simulator</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* SECTION C & D: DEMAND PROFILE & CONTRIBUTOR DONUT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Section C: 24-Hour Predictive Demand Profile Recharts */}
        <HourlyDemandChart
          hourlyProfile={activePrediction.hourlyProfile}
          predictedPeakWindow={activePrediction.predictedPeakWindow}
          maxDemandKw={activePrediction.predictedDemandKw}
        />

        {/* Section D: Energy Contributor Donut */}
        <ContributorDonut
          applianceBreakdown={activePrediction.applianceBreakdown}
          totalDailyKwh={activePrediction.predictedDailyConsumptionKwh}
        />
      </div>

      {/* SECTION E & F: BASELINE COMPARISON & DYNAMIC INSIGHTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Section E: Baseline vs Predicted Comparison */}
        <BaselineComparison
          estimatedDailyCost={activePrediction.estimatedDailyCost}
          estimatedMonthlyCost={activePrediction.estimatedMonthlyCost}
          predictedDailyKwh={activePrediction.predictedDailyConsumptionKwh}
          previousBill={rawInput.previous_bill}
          previousUnits={rawInput.previous_units}
          tariff={facility.tariff || 8.0}
          facilityType={facility.facilityType}
        />

        {/* Section F: Dynamic Insights */}
        <DynamicInsights
          facilityType={facility.facilityType}
          inputData={rawInput}
          prediction={activePrediction}
        />
      </div>

      {/* SECTION G: ACTIONABLE RECOMMENDATIONS WITH INR SAVINGS */}
      <div style={{ marginBottom: '2rem' }}>
        <RecommendationsList recommendations={recommendations} />
      </div>

      {/* SECTION H: PREDICTION HISTORY TIMELINE / SELECTOR */}
      {history.length > 0 && (
        <PredictionHistory
          predictions={history}
          activePredictionId={activePrediction._id}
          onSelectPrediction={(p) => setActivePrediction(p)}
          facilityName={facility.name}
        />
      )}

      {/* SECTION I: ABOUT THE PREDICTION & METHODOLOGY DISCLAIMERS */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          lineHeight: 1.6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.92rem' }}>
          <Info size={16} color="#38bdf8" />
          <span>About the Prediction & Methodology</span>
        </div>
        <p style={{ margin: '0 0 6px 0' }}>
          Predictions are generated using a machine-learning model trained on multi-season operational energy-usage patterns and facility-specific inputs. The model evaluates thermodynamic cooling indices, equipment operational schedules, and coincident peak factors rather than relying on fixed static formulas.
        </p>
        <p style={{ margin: 0, opacity: 0.85 }}>
          <strong>Estimate Disclaimer:</strong> Projected costs and savings shown are calculated approximations based on baseline tariffs and may differ from official DISCOM utility billing due to fuel adjustments, fixed charges, or progressive tariff slabs. Appliance breakdowns represent estimated load contributions rather than physical sub-meter readings.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
