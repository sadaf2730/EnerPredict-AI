import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import OutlookCard from '../components/whatif/OutlookCard';
import HourlyComparisonChart from '../components/whatif/HourlyComparisonChart';
import SimulationInsights from '../components/whatif/SimulationInsights';
import WhatIfHistory from '../components/whatif/WhatIfHistory';
import {
  Sparkles,
  Zap,
  ArrowLeft,
  RotateCcw,
  Activity,
  IndianRupee,
  AlertTriangle,
  Clock,
  Thermometer,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const WhatIfSimulator = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();

  // Component state
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [simulationError, setSimulationError] = useState('');

  const [facility, setFacility] = useState(null);
  const [baselinePrediction, setBaselinePrediction] = useState(null);
  const [baseInput, setBaseInput] = useState({});
  const [modifiedInput, setModifiedInput] = useState({});
  const [history, setHistory] = useState([]);

  // Active simulation results
  const [activeResult, setActiveResult] = useState(null);

  // 1. Initial Load: Facility, Latest Prediction Baseline, Scenarios History
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // A. Facility
      const facRes = await apiClient.get(`/facilities/${facilityId}`);
      const currentFacility = facRes.data.facility;
      setFacility(currentFacility);

      // B. Latest Prediction (Baseline)
      const predRes = await apiClient.get(`/predictions/${facilityId}`);
      const predictions = predRes.data.predictions || [];

      if (predictions.length === 0) {
        // Redirect to input if no prediction exists yet
        navigate(`/facility/${facilityId}/input`, { replace: true });
        return;
      }

      const latest = predictions[0];
      setBaselinePrediction(latest);

      // Extract baseline raw input
      const rawBase =
        latest.energyInput?.inputData ||
        latest.energyInputId?.inputData ||
        latest.inputData ||
        {};
      setBaseInput(rawBase);
      setModifiedInput({ ...rawBase });

      // C. What-If Scenarios History
      const whatIfRes = await apiClient.get(`/whatif/${facilityId}`);
      const scenarios = whatIfRes.data.scenarios || [];
      setHistory(scenarios);

      // If scenarios already exist, default active result to the newest scenario
      if (scenarios.length > 0) {
        setActiveResult(scenarios[0]);
      }
    } catch (err) {
      console.error('Failed to load What-If data:', err);
      setError(
        err.response?.data?.message || 'Unable to load What-If simulator. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facilityId) {
      loadData();
    }
  }, [facilityId]);

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setModifiedInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset to Baseline Inputs
  const handleReset = () => {
    setModifiedInput({ ...baseInput });
    setSimulationError('');
  };

  // Run What-If ML Simulation
  const handleSimulate = async (e) => {
    e.preventDefault();
    try {
      setSimulating(true);
      setSimulationError('');

      // Dispatch to Express backend -> FastAPI -> Trained ML Model
      const res = await apiClient.post(`/whatif/${facilityId}`, {
        modifiedInput,
      });

      const newScenario = res.data.scenario;
      setActiveResult(newScenario);

      // Prepend to history
      setHistory((prev) => [newScenario, ...prev]);
    } catch (err) {
      console.error('Simulation request failed:', err);
      if (err.response?.status === 503) {
        setSimulationError(
          'Unable to run the simulation right now. The prediction service is temporarily unavailable.'
        );
      } else {
        setSimulationError(
          err.response?.data?.message || 'Failed to execute simulation. Please check your inputs.'
        );
      }
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <LoadingSpinner message="Initializing What-If Energy Simulator..." />
      </div>
    );
  }

  if (error || !facility || !baselinePrediction) {
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
            Simulator Unavailable
          </h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error || 'Unable to load baseline energy configuration.'}
          </p>
          <Link
            to="/facilities"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#10b981',
              color: '#fff',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Back to Facilities
          </Link>
        </div>
      </div>
    );
  }

  const facilityType = facility.facilityType;

  // Helper for input row with visual change indicator
  const renderField = (fieldKey, label, type = 'number', min = 0, max = 24, step = 1, unit = '') => {
    const currentVal = baseInput[fieldKey] !== undefined ? baseInput[fieldKey] : 0;
    const modifiedVal = modifiedInput[fieldKey] !== undefined ? modifiedInput[fieldKey] : currentVal;
    const isChanged = Number(modifiedVal) !== Number(currentVal);

    return (
      <div
        key={fieldKey}
        style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: isChanged ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card-inner)',
          border: isChanged ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-inner)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-heading)' }}>
            {label}
          </label>
          {isChanged && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--primary)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              Modified
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px' }}>
          {/* Baseline Value */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner-subtle)',
              border: '1px solid var(--border-inner)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
              Current
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
              {currentVal} {unit}
            </span>
          </div>

          <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>→</span>

          {/* Interactive What-If Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type={type}
              min={min}
              max={max}
              step={step}
              value={modifiedVal}
              onChange={(e) => handleInputChange(fieldKey, Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: isChanged ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                border: isChanged ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                fontWeight: '700',
                fontFamily: 'monospace',
                textAlign: 'center',
                outline: 'none',
              }}
            />
            {unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>}
          </div>
        </div>

        {/* Optional Range Slider for quick adjustment */}
        {type === 'number' && max > min && (
          <div style={{ marginTop: '8px' }}>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={modifiedVal}
              onChange={(e) => handleInputChange(fieldKey, Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#10b981',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Link
              to={`/dashboard/${facility._id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                color: '#10b981',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {facility.facilityName || facility.name} ({facility.facilityType.replace('_', ' ')})
            </span>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px',
            }}
          >
            What-If Energy Simulator
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-dim, #94a3b8)', margin: 0 }}>
            Explore how changes in your usage could affect your predicted energy consumption.
          </p>
        </div>

        {/* Top Badges */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.86rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={15} />
            <span>Reset Changes</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CURRENT BASELINE SUMMARY */}
      <div
        style={{
          background: 'var(--bg-card-gradient)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#0ea5e9" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Current Prediction Baseline
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Reference point for all simulation comparisons
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Daily Consumption */}
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-card-inner)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Consumption
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                {Number(baselinePrediction.predictedDailyConsumptionKwh).toFixed(1)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>kWh</span>
            </div>
          </div>

          {/* Peak Demand */}
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-card-inner)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Peak Demand
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                {Number(baselinePrediction.predictedDemandKw).toFixed(1)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>kW</span>
            </div>
          </div>

          {/* Monthly Cost */}
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-card-inner)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Monthly Cost
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                ₹{Math.round(baselinePrediction.estimatedMonthlyCost || 0).toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ mo</span>
            </div>
          </div>

          {/* Peak Risk */}
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-card-inner)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Peak Risk
            </span>
            <div style={{ marginTop: '6px' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background:
                    baselinePrediction.peakRisk === 'High'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : baselinePrediction.peakRisk === 'Medium'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color:
                    baselinePrediction.peakRisk === 'High'
                      ? '#f87171'
                      : baselinePrediction.peakRisk === 'Medium'
                      ? '#fbbf24'
                      : 'var(--primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {baselinePrediction.peakRisk || 'Low'} Risk ({baselinePrediction.predictedPeakWindow || 'N/A'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MODIFIABLE INPUTS & SIMULATE ACTION */}
      <form onSubmit={handleSimulate} style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            background: 'var(--bg-card-gradient)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                Adjust Facility Operational Parameters
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Modify one or more fields below, then click Simulate Change
            </span>
          </div>

          {/* Dynamic Facility Fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* 1. HOME */}
            {facilityType === 'home' && (
              <>
                {renderField('ac_units', 'Air Conditioners', 'number', 0, 8, 1, 'units')}
                {renderField('ac_hours', 'AC Usage Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('fan_units', 'Ceiling Fans', 'number', 0, 15, 1, 'units')}
                {renderField('fan_hours', 'Fan Usage Hours', 'number', 0, 24, 1, 'hrs/day')}
                {renderField('geyser_hours', 'Water Geyser Usage', 'number', 0, 10, 0.5, 'hrs/day')}
                {renderField('washing_machine_hours', 'Washing Machine', 'number', 0, 8, 0.5, 'hrs/day')}
                {renderField('tv_hours', 'TV Usage Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('ev_charging_hours', 'EV Home Charging', 'number', 0, 16, 0.5, 'hrs/day')}
                {renderField('temperature', 'Ambient Temperature', 'number', 15, 50, 0.5, '°C')}
              </>
            )}

            {/* 2. HOUSING SOCIETY */}
            {facilityType === 'housing_society' && (
              <>
                {renderField('occupied_flats', 'Occupied Flats', 'number', 1, 500, 1, 'flats')}
                {renderField('lift_usage_level', 'Lift Intensity (1:Low, 2:Med, 3:High)', 'number', 1, 3, 1, 'level')}
                {renderField('pump_hours', 'Water Pump Runtime', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('common_lighting_hours', 'Common Lighting Duration', 'number', 0, 24, 0.5, 'hrs/night')}
                {renderField('ev_usage_hours', 'Society EV Bays Active', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('temperature', 'Ambient Temperature', 'number', 15, 50, 0.5, '°C')}
              </>
            )}

            {/* 3. OFFICE */}
            {facilityType === 'office' && (
              <>
                {renderField('employees_present', 'Employees Present', 'number', 1, 2000, 1, 'people')}
                {renderField('computers', 'Active Workstations', 'number', 1, 2000, 1, 'units')}
                {renderField('computer_hours', 'Workstation Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('ac_units', 'HVAC / AC Zones', 'number', 0, 60, 1, 'units')}
                {renderField('ac_hours', 'AC Operational Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('working_hours', 'Office Operating Hours', 'number', 1, 24, 0.5, 'hrs/day')}
                {renderField('server_hours', 'Server Infrastructure', 'number', 0, 24, 1, 'hrs/day')}
                {renderField('lighting_hours', 'Facility Lighting Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('temperature', 'Ambient Temperature', 'number', 15, 50, 0.5, '°C')}
              </>
            )}

            {/* 4. COLLEGE */}
            {facilityType === 'college' && (
              <>
                {renderField('students_present', 'Students on Campus', 'number', 10, 5000, 10, 'students')}
                {renderField('computer_hours', 'Computing Lab Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('lab_hours', 'Heavy Tech Labs Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('ac_units', 'Campus AC Units', 'number', 0, 80, 1, 'units')}
                {renderField('ac_hours', 'AC Runtime Hours', 'number', 0, 24, 0.5, 'hrs/day')}
                {renderField('hostel_occupancy', 'Hostel Residents Present', 'number', 0, 2000, 10, 'residents')}
                {renderField('event_duration_hours', 'Campus Event Duration', 'number', 0, 18, 0.5, 'hrs/day')}
                {renderField('temperature', 'Ambient Temperature', 'number', 15, 50, 0.5, '°C')}
              </>
            )}

            {/* 5. FUNCTION HALL */}
            {facilityType === 'function_hall' && (
              <>
                {renderField('expected_guests', 'Expected Attendees', 'number', 10, 3000, 25, 'guests')}
                {renderField('event_duration_hours', 'Event Duration Hours', 'number', 1, 24, 0.5, 'hrs')}
                {renderField('ac_units', 'Hall Chillers / ACs', 'number', 0, 50, 1, 'units')}
                {renderField('ac_hours', 'Chiller Runtime Hours', 'number', 0, 24, 0.5, 'hrs')}
                {renderField('decorative_lighting_hours', 'Decorative Lighting Hours', 'number', 0, 24, 0.5, 'hrs')}
                {renderField('temperature', 'Ambient Temperature', 'number', 15, 50, 0.5, '°C')}
              </>
            )}
          </div>

          {/* Simulation Error Alert */}
          {simulationError && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle size={18} />
              <span>{simulationError}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={simulating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 36px',
                borderRadius: '30px',
                background: simulating
                  ? 'rgba(16, 185, 129, 0.4)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: '700',
                border: 'none',
                cursor: simulating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={20} />
              <span>{simulating ? 'Recalculating your energy outlook...' : 'Simulate Change'}</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', margin: '12px 0 0 0' }}>
            Modified parameters are fed directly into the trained Gradient Boosting ML model for genuine re-inference.
          </p>
        </div>
      </form>

      {/* SECTION 3: SIMULATION RESULTS (BEFORE VS AFTER) */}
      {activeResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* A. Before vs After Outlook Card */}
          <OutlookCard
            beforePrediction={activeResult.beforePrediction}
            afterPrediction={activeResult.afterPrediction}
            comparison={activeResult.comparison}
            facilityTariff={facility.tariff}
          />

          {/* B. Hourly Demand Curve Comparison */}
          <HourlyComparisonChart
            beforeProfile={activeResult.beforePrediction?.hourlyProfile}
            afterProfile={activeResult.afterPrediction?.hourlyProfile}
            peakWindowBefore={activeResult.beforePrediction?.predictedPeakWindow}
            peakWindowAfter={activeResult.afterPrediction?.predictedPeakWindow}
          />

          {/* C. Personalized Dynamic Simulation Insights */}
          <SimulationInsights
            baseInput={activeResult.baseInput}
            modifiedInput={activeResult.modifiedInput}
            comparison={activeResult.comparison}
            facilityType={facility.facilityType}
          />
        </div>
      )}

      {/* SECTION 4: SCENARIO HISTORY */}
      {history.length > 0 && (
        <div>
          <WhatIfHistory
            scenarios={history}
            activeScenarioId={activeResult?._id}
            onSelectScenario={(s) => setActiveResult(s)}
          />
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulator;
