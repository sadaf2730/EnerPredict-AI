import React from 'react';
import { Lightbulb, Thermometer, Layers, AlertTriangle, ShieldCheck, Gauge } from 'lucide-react';

const DynamicInsights = ({
  facilityType = 'home',
  inputData = {},
  prediction = {},
}) => {
  const temp = Number(inputData.temperature || 30);
  const peakKw = Number(prediction.predictedDemandKw || 0);
  const peakWindow = prediction.predictedPeakWindow || '14:00 - 18:00';
  const peakRisk = prediction.peakRisk || 'Low';
  const dailyKwh = Number(prediction.predictedDailyConsumptionKwh || 0);

  // Generate dynamic explanations
  const insights = [];

  // 1. Temperature & Thermal Analysis
  let tempInsight = '';
  if (temp >= 35) {
    tempInsight = `At ${temp}°C, extreme ambient heat forces refrigeration and air conditioning compressors to operate at maximum duty cycles, elevating cooling load by an estimated 25–35% compared to moderate days.`;
  } else if (temp >= 28) {
    tempInsight = `At ${temp}°C ambient temperature, continuous heat ingress into buildings increases steady-state cooling power demand by approximately 12–18%.`;
  } else {
    tempInsight = `At ${temp}°C ambient temperature, cooling thermal load is mild, keeping compressor power close to baseline operational ratings.`;
  }
  insights.push({
    title: 'Thermal & Weather Influence',
    icon: Thermometer,
    color: temp >= 32 ? '#f87171' : '#0ea5e9',
    description: tempInsight,
  });

  // 2. Coincident Load & Peak Window Explanation
  let peakDriver = '';
  if (facilityType === 'home') {
    const acUnits = Number(inputData.ac_units || 0);
    const evHours = Number(inputData.ev_charging_hours || 0);
    if (acUnits > 0 && evHours > 0) {
      peakDriver = `Your peak occurs during ${peakWindow} primarily due to concurrent operation of ${acUnits} AC units alongside residential EV charging and cooking/water heating equipment.`;
    } else if (acUnits > 0) {
      peakDriver = `Your peak is concentrated during ${peakWindow} because ${acUnits} air conditioner(s) run continuously, coinciding with evening domestic household routines.`;
    } else {
      peakDriver = `Peak demand is driven by cumulative domestic appliance activity (refrigeration, lighting, water pump, and entertainment) peaking in the evening.`;
    }
  } else if (facilityType === 'housing_society') {
    const pumps = Number(inputData.pumps || 2);
    const lifts = Number(inputData.lifts || 2);
    peakDriver = `The society's peak load reaches ${peakKw.toFixed(1)} kW in ${peakWindow} due to simultaneous water transfer pump cycles (${pumps} pumps) synchronized with high resident elevator usage (${lifts} lifts) and corridor illumination.`;
  } else if (facilityType === 'office') {
    const computers = Number(inputData.computers || 50);
    const acUnits = Number(inputData.ac_units || 8);
    peakDriver = `The workplace demand peak of ${peakKw.toFixed(1)} kW during ${peakWindow} aligns with peak core business hours when ${computers} workstations, server rooms, and ${acUnits} central HVAC zones run at 100% capacity.`;
  } else if (facilityType === 'college') {
    const labs = Number(inputData.labs || 4);
    peakDriver = `Campus peak load of ${peakKw.toFixed(1)} kW during ${peakWindow} reflects peak academic schedules, where ${labs} active technical laboratories, computer centers, and lecture hall chillers run in parallel.`;
  } else if (facilityType === 'function_hall') {
    const guests = Number(inputData.expected_guests || 300);
    peakDriver = `Event peak load of ${peakKw.toFixed(1)} kW concentrates in ${peakWindow} due to full occupancy of ${guests} guests, requiring maximum chiller capacity, stage lighting, and commercial kitchen catering warmers simultaneously.`;
  }
  insights.push({
    title: `Peak Window Drivers (${peakWindow})`,
    icon: Layers,
    color: '#8b5cf6',
    description: peakDriver,
  });

  // 3. Peak Risk Interpretation
  let riskDetail = '';
  if (peakRisk === 'High') {
    riskDetail = `Peak risk is HIGH: The predicted peak demand of ${peakKw.toFixed(1)} kW significantly exceeds normal baseline capacity, risking commercial demand penalty charges or breaker trips during grid stress.`;
  } else if (peakRisk === 'Medium') {
    riskDetail = `Peak risk is MEDIUM: Demand is within permissible sanction bounds (${peakKw.toFixed(1)} kW), but sudden concurrent equipment activation during ${peakWindow} could trigger higher tariff slabs.`;
  } else {
    riskDetail = `Peak risk is LOW: Your predicted peak demand of ${peakKw.toFixed(1)} kW is well-distributed relative to overall consumption, demonstrating balanced load staggering.`;
  }
  insights.push({
    title: `Peak Stress Assessment (${peakRisk} Risk)`,
    icon: peakRisk === 'High' ? AlertTriangle : peakRisk === 'Medium' ? Gauge : ShieldCheck,
    color: peakRisk === 'High' ? '#f87171' : peakRisk === 'Medium' ? '#f59e0b' : '#10b981',
    description: riskDetail,
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
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
            Dynamic Peak Intelligence
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Contextual analysis of how your equipment combinations and weather drive demand
        </p>
      </div>

      {/* Grid of Insight Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-inner)',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-heading)', display: 'block' }}>
                  {item.title}
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicInsights;
