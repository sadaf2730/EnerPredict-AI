import React from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

const SimulationInsights = ({
  baseInput = {},
  modifiedInput = {},
  comparison = {},
  facilityType = 'home',
}) => {
  const kwhDiff = comparison.dailyConsumptionDiff || 0;
  const kwDiff = comparison.demandDiff || 0;
  const costDiff = comparison.monthlyCostDiff || 0;
  const isReduced = kwhDiff < 0 || costDiff < 0;
  const isIncreased = kwhDiff > 0 || costDiff > 0;

  // Detect specific field modifications
  const insights = [];

  // AC adjustments
  const baseAcUnits = Number(baseInput.ac_units || 0);
  const modAcUnits = Number(modifiedInput.ac_units || 0);
  const baseAcHours = Number(baseInput.ac_hours || 0);
  const modAcHours = Number(modifiedInput.ac_hours || 0);

  if (baseAcUnits !== modAcUnits || baseAcHours !== modAcHours) {
    if (modAcUnits < baseAcUnits || modAcHours < baseAcHours) {
      insights.push(
        `Reducing AC operation (${baseAcUnits} units @ ${baseAcHours}h → ${modAcUnits} units @ ${modAcHours}h) lowered thermal cooling electrical draw, which is the primary driver of afternoon and evening demand peaks.`
      );
    } else if (modAcUnits > baseAcUnits || modAcHours > baseAcHours) {
      insights.push(
        `Increasing air-conditioning capacity or runtime (${baseAcUnits} units @ ${baseAcHours}h → ${modAcUnits} units @ ${modAcHours}h) added significant compressor load, driving higher daily kWh and peak kW.`
      );
    }
  }

  // Workstation / Computer adjustments
  const baseComputers = Number(baseInput.computers || 0);
  const modComputers = Number(modifiedInput.computers || 0);
  const baseCompHours = Number(baseInput.computer_hours || 0);
  const modCompHours = Number(modifiedInput.computer_hours || 0);

  if (baseComputers !== modComputers || baseCompHours !== modCompHours) {
    if (modComputers < baseComputers || modCompHours < baseCompHours) {
      insights.push(
        `Lower active computer workstation usage (${baseComputers} units @ ${baseCompHours}h → ${modComputers} units @ ${modCompHours}h) trimmed steady-state baseline electrical consumption.`
      );
    } else {
      insights.push(
        `Elevated computer workstation operations added continuous computing load across work hours.`
      );
    }
  }

  // Pump adjustments (Society)
  const basePumps = Number(baseInput.pumps || 0);
  const modPumps = Number(modifiedInput.pumps || 0);
  const basePumpHours = Number(baseInput.pump_hours || 0);
  const modPumpHours = Number(modifiedInput.pump_hours || 0);

  if (basePumps !== modPumps || basePumpHours !== modPumpHours) {
    if (modPumpHours < basePumpHours) {
      insights.push(
        `Optimizing water pump operation from ${basePumpHours}h down to ${modPumpHours}h daily successfully trimmed high inductive motor demand.`
      );
    } else {
      insights.push(
        `Extended water pump runtime from ${basePumpHours}h to ${modPumpHours}h expanded daily pumping energy consumption.`
      );
    }
  }

  // EV charging adjustments
  const baseEvHours = Number(baseInput.ev_charging_hours || baseInput.ev_usage_hours || 0);
  const modEvHours = Number(modifiedInput.ev_charging_hours || modifiedInput.ev_usage_hours || 0);

  if (baseEvHours !== modEvHours) {
    if (modEvHours < baseEvHours) {
      insights.push(
        `Decreasing or shifting EV charging duration (${baseEvHours}h → ${modEvHours}h) diminished intense single-phase or three-phase charging load spikes.`
      );
    } else {
      insights.push(
        `Added EV charging hours (${baseEvHours}h → ${modEvHours}h) introduced heavy electrical draw, raising daily consumption.`
      );
    }
  }

  // General Temperature influence if altered
  const baseTemp = Number(baseInput.temperature || 30);
  const modTemp = Number(modifiedInput.temperature || 30);
  if (baseTemp !== modTemp) {
    if (modTemp < baseTemp) {
      insights.push(
        `Simulating a cooler ambient temperature (${baseTemp}°C → ${modTemp}°C) reduced condenser pressure and improved cooling COP.`
      );
    } else {
      insights.push(
        `Simulating higher ambient heat (${baseTemp}°C → ${modTemp}°C) forced refrigeration equipment to operate at harsher thermal cycle penalties.`
      );
    }
  }

  // Synthesis summary string
  let summaryText = '';
  if (isReduced) {
    summaryText = `This simulation achieves positive efficiency gains, curbing total energy usage by ~${Math.abs(kwhDiff).toFixed(1)} kWh/day and reducing peak pressure.`;
  } else if (isIncreased) {
    summaryText = `This configuration expands overall facility energy draw by ~${Math.abs(kwhDiff).toFixed(1)} kWh/day, which will elevate utility billing without mitigation.`;
  } else {
    summaryText = 'The tested adjustments produce minimal net shift on total energy demand compared to current baseline operations.';
  }

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
        gap: '1rem',
        transition: 'var(--theme-transition)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Lightbulb size={20} color="#fbbf24" />
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
          Personalized Simulation Insights
        </h3>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: isReduced
            ? 'var(--primary-bg-subtle)'
            : isIncreased
            ? 'rgba(239, 68, 68, 0.08)'
            : 'var(--bg-card-inner)',
          border: `1px solid ${
            isReduced
              ? 'var(--primary-border-subtle)'
              : isIncreased
              ? 'rgba(239, 68, 68, 0.25)'
              : 'var(--border-inner)'
          }`,
        }}
      >
        <span style={{ fontSize: '0.9rem', color: isReduced ? 'var(--primary)' : isIncreased ? '#f87171' : 'var(--text-main)', fontWeight: '600' }}>
          {summaryText}
        </span>
      </div>

      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Key Driver Observations:
          </span>
          {insights.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45,
              }}
            >
              <Zap size={14} color="var(--primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationInsights;
