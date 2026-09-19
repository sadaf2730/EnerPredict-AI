/**
 * Recommendation and Savings Engine
 * Generates dynamic, input-tailored energy optimization recommendations
 * with realistic INR (₹) monthly savings estimations based on ML prediction output and user inputs.
 */

export const generateRecommendations = (facilityType, inputData = {}, prediction = {}) => {
  const recommendations = [];
  const tariff = inputData.tariff || 8.0; // Default ₹8/kWh
  const dailyKwh = prediction.predictedDailyConsumptionKwh || 50;
  const peakKw = prediction.predictedDemandKw || 5;
  const peakWindow = prediction.predictedPeakWindow || '14:00 - 18:00';
  const peakRisk = prediction.peakRisk || 'Low';

  // Helper to calculate approximate monthly savings
  // (kWh saved per day * 30 days * tariff rate)
  const calcMonthlySavings = (dailySavedKwh) => {
    return Math.round(dailySavedKwh * 30 * tariff);
  };

  // ----------------------------------------------------
  // 1. HOME RECOMMENDATIONS
  // ----------------------------------------------------
  if (facilityType === 'home') {
    const acUnits = Number(inputData.ac_units || 0);
    const acHours = Number(inputData.ac_hours || 0);
    const evHours = Number(inputData.ev_charging_hours || 0);
    const geyserHours = Number(inputData.geyser_hours || 0);
    const temp = Number(inputData.temperature || 30);

    // AC Optimization
    if (acUnits > 0 && acHours >= 4) {
      const dailySaved = acUnits * 1.2 * 1.5; // ~1.5 kWh/unit saved by setting 24°C & eco mode
      recommendations.push({
        id: 'home_ac_temp',
        title: 'Optimize AC Thermostat to 24°C & Eco Mode',
        category: 'appliance',
        priority: acHours > 7 ? 'high' : 'medium',
        why: `You have ${acUnits} AC unit(s) running ~${acHours} hrs/day during ${temp}°C ambient weather, accounting for over 40% of your power bill.`,
        expectedEffect: `Each 1°C increase in AC setpoint saves ~6% cooling electricity. Estimated drop of ${(dailySaved).toFixed(1)} kWh/day.`,
        estimatedSavingsMonthly: calcMonthlySavings(dailySaved),
        actionStep: 'Set your AC thermostat to 24°C rather than 18-20°C, and use timer modes during sleep.',
      });
    }

    // Peak shifting for AC during grid stress
    if (acUnits > 0 && (peakRisk === 'High' || peakRisk === 'Medium')) {
      const shiftedKwh = acUnits * 1.0 * 2.0;
      recommendations.push({
        id: 'home_pre_cooling',
        title: 'Pre-Cool Living Areas Before Peak Window',
        category: 'timing',
        priority: 'high',
        why: `Your predicted peak window is ${peakWindow} with ${peakKw.toFixed(1)} kW demand. Concentrating cooling during this time maximizes peak grid stress.`,
        expectedEffect: `Reduces peak load by ~1.2 kW during the ${peakWindow} window by cooling rooms 1 hour earlier and using fans to circulate chilled air.`,
        estimatedSavingsMonthly: calcMonthlySavings(shiftedKwh * 0.4),
        actionStep: `Run ACs at 22°C between 13:00 - 14:00, then switch to fan mode or 26°C during ${peakWindow}.`,
      });
    }

    // EV Charging
    if (evHours > 0) {
      const evSaved = evHours * 2.5; // Shift to off-peak night
      recommendations.push({
        id: 'home_ev_shift',
        title: 'Shift EV Charging to Midnight Off-Peak Slot',
        category: 'timing',
        priority: 'high',
        why: `EV charging runs for ~${evHours} hrs. Daytime charging coincides with residential domestic peak and raises peak load to ${peakKw.toFixed(1)} kW.`,
        expectedEffect: `Eliminates up to 3.3 kW of daytime grid spike, shifting ~${(evHours * 3.3).toFixed(1)} kWh to cheaper midnight grid hours.`,
        estimatedSavingsMonthly: calcMonthlySavings(evHours * 1.2),
        actionStep: 'Program EV home charger to start automatically after 23:00.',
      });
    }

    // Water Geyser
    if (geyserHours >= 1.5) {
      const geyserSaved = 1.5 * (geyserHours - 0.75);
      recommendations.push({
        id: 'home_geyser_timer',
        title: 'Install Geyser Smart Plug or Mechanical Timer',
        category: 'efficiency',
        priority: 'medium',
        why: `Water heating accounts for ~${geyserHours} hours daily. Prolonged standby heating causes unnecessary re-heating cycles.`,
        expectedEffect: `Caps water heating strictly to 45 mins before bathing, preventing 1.5–3.0 kWh/day in standby heat loss.`,
        estimatedSavingsMonthly: calcMonthlySavings(geyserSaved),
        actionStep: 'Limit continuous geyser operation to 30–45 minutes per morning using a digital smart plug.',
      });
    }

    // Solar recommendation if consumption is high
    if (dailyKwh > 25 && !inputData.solar_available) {
      const solarPotential = dailyKwh * 0.6;
      recommendations.push({
        id: 'home_rooftop_solar',
        title: 'Adopt Rooftop Solar Net-Metering (3–5 kWp)',
        category: 'solar',
        priority: 'medium',
        why: `Your daily usage of ${dailyKwh.toFixed(1)} kWh (~${(dailyKwh * 30).toFixed(0)} units/month) places you in high domestic billing slabs.`,
        expectedEffect: `A 3 kWp solar system produces ~12–14 kWh/day, offsetting up to 55% of your daytime domestic consumption.`,
        estimatedSavingsMonthly: calcMonthlySavings(solarPotential),
        actionStep: 'Evaluate state rooftop solar subsidies (PM Surya Ghar Muft Bijli Yojana).',
      });
    }
  }

  // ----------------------------------------------------
  // 2. HOUSING SOCIETY RECOMMENDATIONS
  // ----------------------------------------------------
  else if (facilityType === 'housing_society') {
    const pumps = Number(inputData.pumps || 2);
    const pumpHours = Number(inputData.pump_hours || 4);
    const lifts = Number(inputData.lifts || 3);
    const commonLighting = Number(inputData.common_lighting_hours || 10);
    const evPoints = Number(inputData.ev_points || 0);

    // Pump Staggering
    if (pumps > 1 && pumpHours >= 3) {
      const pumpSavedKwh = pumps * 3.5 * 1.5;
      recommendations.push({
        id: 'society_pump_staggering',
        title: 'Stagger Overhead & Borewell Pump Operations',
        category: 'timing',
        priority: 'high',
        why: `Operating ${pumps} water pumps simultaneously for ${pumpHours} hrs creates severe demand spikes, contributing heavily to your ${peakKw.toFixed(1)} kW peak.`,
        expectedEffect: `Staggering pump schedules cuts peak demand by ~${(pumps * 3.7).toFixed(1)} kW without reducing total water pumped.`,
        estimatedSavingsMonthly: calcMonthlySavings(pumpSavedKwh * 0.5),
        actionStep: `Run Pump 1 at 05:00 - 07:00 and Pump 2 at 13:00 - 15:00, strictly avoiding the ${peakWindow} peak interval.`,
      });
    }

    // Common Lighting LED Conversion
    if (commonLighting >= 8) {
      const lightSavedKwh = 12.0;
      recommendations.push({
        id: 'society_common_lighting_sensors',
        title: 'Automate Common Area & Staircase Lighting with Motion Sensors',
        category: 'efficiency',
        priority: 'medium',
        why: `Common area lighting operates ~${commonLighting} hrs/night across corridors, parking, and perimeter walls.`,
        expectedEffect: `Motion-sensor dimming (30% base luminosity, 100% on motion) saves ~10–18 kWh/night across shared zones.`,
        estimatedSavingsMonthly: calcMonthlySavings(lightSavedKwh),
        actionStep: 'Install microwave motion sensors in basement parking and building stairwells.',
      });
    }

    // Lift Regenerative Drives
    if (lifts >= 2) {
      recommendations.push({
        id: 'society_lift_optimization',
        title: 'Optimize Lift Dispatch & Standby Sleep Modes',
        category: 'appliance',
        priority: 'medium',
        why: `With ${lifts} elevators running throughout the day, idle standby cabin fans and lighting consume continuous baseline power.`,
        expectedEffect: `Automatic car light/fan auto-off after 2 minutes idle saves ~4–6 kWh/day per shaft.`,
        estimatedSavingsMonthly: calcMonthlySavings(lifts * 4),
        actionStep: 'Enable smart standby sleep timer in the elevator controller panel.',
      });
    }

    // EV Charging Policy
    if (evPoints > 2) {
      recommendations.push({
        id: 'society_ev_management',
        title: 'Implement Managed Dynamic EV Load Balancing',
        category: 'timing',
        priority: 'high',
        why: `Society has ${evPoints} EV charging points. Simultaneous evening charging creates catastrophic transformer overload risks during ${peakWindow}.`,
        expectedEffect: `Dynamic load balancing distributes charging slots sequentially past 22:30, avoiding high commercial maximum demand penalties.`,
        estimatedSavingsMonthly: calcMonthlySavings(evPoints * 3.0),
        actionStep: 'Adopt scheduled rotational charging time slots for electric two-wheelers and four-wheelers.',
      });
    }
  }

  // ----------------------------------------------------
  // 3. OFFICE RECOMMENDATIONS
  // ----------------------------------------------------
  else if (facilityType === 'office') {
    const acUnits = Number(inputData.ac_units || 10);
    const acHours = Number(inputData.ac_hours || 9);
    const computers = Number(inputData.computers || 50);
    const workingHours = Number(inputData.working_hours || 9);
    const serverActive = Number(inputData.server_active || 1);

    // Central AC Setpoint
    if (acUnits > 0) {
      const acSavedKwh = acUnits * 2.2 * 1.5;
      recommendations.push({
        id: 'office_hvac_setpoint',
        title: 'Standardize Corporate HVAC to 24.5°C & Implement VAV Tuning',
        category: 'appliance',
        priority: 'high',
        why: `Your ${acUnits} commercial AC/HVAC units run for ${acHours} hrs daily and dominate total working hours demand.`,
        expectedEffect: `Raising temperature from typical 21°C to 24.5°C reduces cooling compressor energy by ~18% (${acSavedKwh.toFixed(1)} kWh/day).`,
        estimatedSavingsMonthly: calcMonthlySavings(acSavedKwh),
        actionStep: 'Lock building BMS thermostat at 24.5°C and ensure regular filter and condenser coil maintenance.',
      });
    }

    // IT Equipment & Workstation Sleep Policies
    if (computers >= 20) {
      const itSavedKwh = (computers * 0.08) * (24 - workingHours);
      recommendations.push({
        id: 'office_pc_power_management',
        title: 'Deploy Active Directory Power Management Policy',
        category: 'efficiency',
        priority: 'medium',
        why: `${computers} workstations left in idle or screen-saver mode overnight draw 35–60W parasitic phantom power each.`,
        expectedEffect: `Automated hibernation at 19:30 saves ~${itSavedKwh.toFixed(1)} kWh/day across all desktop terminals.`,
        estimatedSavingsMonthly: calcMonthlySavings(itSavedKwh),
        actionStep: 'Push an IT Group Policy (GPO) to put idle computers to deep sleep after 20 minutes inactivity.',
      });
    }

    // Server Room Cold Aisle Containment
    if (serverActive) {
      const serverSaved = 15.0;
      recommendations.push({
        id: 'office_server_room_cooling',
        title: 'Deploy Server Rack Blanking Panels & Cold Aisle Isolation',
        category: 'appliance',
        priority: 'medium',
        why: 'Server room precision AC runs 24/7. Recirculation of hot exhaust air forces cooling units to overwork.',
        expectedEffect: 'Prevents hot spot recirculation, allowing server room setpoints to be raised safely from 19°C to 23°C.',
        estimatedSavingsMonthly: calcMonthlySavings(serverSaved),
        actionStep: 'Install PVC strip curtains or containment doors on cold aisle server rows.',
      });
    }

    // Demand Peak Shaving
    if (peakKw > 30) {
      recommendations.push({
        id: 'office_peak_shaving',
        title: 'Shift High-Energy Tasks Away from Peak Window',
        category: 'timing',
        priority: 'high',
        why: `Predicted peak demand reaches ${peakKw.toFixed(1)} kW during ${peakWindow}, triggering industrial maximum demand surcharges.`,
        expectedEffect: `Rescheduling heavy print runs, pantry dishwashers, and water filtration out of ${peakWindow} cuts peak demand by ~15%.`,
        estimatedSavingsMonthly: calcMonthlySavings(25),
        actionStep: `Establish office guidelines restricting non-essential heavy appliance use between ${peakWindow}.`,
      });
    }
  }

  // ----------------------------------------------------
  // 4. COLLEGE / INSTITUTION RECOMMENDATIONS
  // ----------------------------------------------------
  else if (facilityType === 'college') {
    const classrooms = Number(inputData.classrooms || 25);
    const labs = Number(inputData.labs || 6);
    const acUnits = Number(inputData.ac_units || 12);
    const hostelActive = Number(inputData.hostel_active || 1);

    // Lab Computer Shutdown
    if (labs > 0) {
      const labSavedKwh = labs * 12.0;
      recommendations.push({
        id: 'college_lab_idle_cut',
        title: 'Automate Lab Master Power Disconnect After Class Hours',
        category: 'efficiency',
        priority: 'high',
        why: `${labs} specialized computer & electronics laboratories remain powered even during vacant periods.`,
        expectedEffect: `Master contactors wired to lab switches eliminate ~${labSavedKwh.toFixed(0)} kWh/day of unattended peripheral drain.`,
        estimatedSavingsMonthly: calcMonthlySavings(labSavedKwh),
        actionStep: 'Install master contactor relays at lab entrances tied to faculty RFID keycards.',
      });
    }

    // AC Zoned Timetable Optimization
    if (acUnits > 0) {
      const acSaved = acUnits * 2.5 * 1.5;
      recommendations.push({
        id: 'college_zoned_air_con',
        title: 'Classroom AC Dynamic Occupancy Sensors',
        category: 'appliance',
        priority: 'high',
        why: `Campus air-conditioning units (${acUnits} units) run continuously across lecture halls regardless of actual lecture scheduling.`,
        expectedEffect: `Cuts wasted cooling in empty classrooms by up to 25%, saving ~${acSaved.toFixed(1)} kWh/day.`,
        estimatedSavingsMonthly: calcMonthlySavings(acSaved),
        actionStep: 'Interlock classroom AC controls with timetable room allocation or PIR occupancy sensors.',
      });
    }

    // Hostel Solar Water Heating
    if (hostelActive) {
      const hostelSaved = 35.0;
      recommendations.push({
        id: 'college_hostel_solar_thermal',
        title: 'Install Solar Thermal Water Heaters for Student Hostels',
        category: 'solar',
        priority: 'medium',
        why: 'Student hostels create tremendous morning electric water heating surges, elevating campus peak demand.',
        expectedEffect: 'Replaces electric geyser spikes with zero-carbon rooftop solar evacuation tubes, saving ~35 kWh/day.',
        estimatedSavingsMonthly: calcMonthlySavings(hostelSaved),
        actionStep: 'Retrofit rooftop solar thermal collectors with electric backup exclusively for overcast days.',
      });
    }
  }

  // ----------------------------------------------------
  // 5. FUNCTION HALL / EVENT VENUE RECOMMENDATIONS
  // ----------------------------------------------------
  else if (facilityType === 'function_hall') {
    const acUnits = Number(inputData.ac_units || 15);
    const guests = Number(inputData.expected_guests || 400);
    const cateringActive = Number(inputData.catering_active || 1);
    const eventHours = Number(inputData.event_duration_hours || 6);

    // Pre-Cooling Event Venue
    if (acUnits > 0) {
      const hallAcSaved = acUnits * 2.8 * 2.0;
      recommendations.push({
        id: 'hall_precooling_protocol',
        title: 'Thermal Mass Pre-Cooling Strategy Before Guest Arrival',
        category: 'timing',
        priority: 'high',
        why: `Cooling the hall with ${guests} guests present during ${peakWindow} pushes cooling machinery to its absolute thermal limit (${peakKw.toFixed(1)} kW).`,
        expectedEffect: `Pre-cooling the empty hall 2 hours in advance at lower ambient temperatures cuts peak demand by up to 22% during peak guest hours.`,
        estimatedSavingsMonthly: calcMonthlySavings(hallAcSaved * 0.4),
        actionStep: `Pre-chill the hall to 21°C two hours before doors open, then maintain at 24°C once guests fill the hall.`,
      });
    }

    // LED Decorative Lighting
    recommendations.push({
      id: 'hall_led_chandeliers',
      title: 'Transition Halogen Stage & Decorative Wash Lights to Low-Heat LEDs',
      category: 'efficiency',
      priority: 'high',
      why: 'Halogen stage lamps generate extreme internal radiant heat, causing AC chillers to work twice as hard to extract heat.',
      expectedEffect: 'Direct lighting electrical savings of ~15 kWh/event plus reduced HVAC cooling compensation load of ~8 kWh/event.',
      estimatedSavingsMonthly: calcMonthlySavings(20),
      actionStep: 'Swap 500W tungsten-halogen par cans for 60W COB LED profile fixtures.',
    });

    // Kitchen & Catering Power Factor
    if (cateringActive) {
      recommendations.push({
        id: 'hall_catering_equipment',
        title: 'Shift Food Warming from Electric Resistive Elements to Commercial Induction/Bain-Marie',
        category: 'appliance',
        priority: 'medium',
        why: 'Electric food warmers and buffet heaters draw continuous high-amperage current during banquet hours.',
        expectedEffect: 'Improves thermal transfer efficiency by 40%, reducing catering load by 12–18 kWh/event.',
        estimatedSavingsMonthly: calcMonthlySavings(15),
        actionStep: 'Standardize on high-efficiency insulated food warmers rather than open-element buffet tables.',
      });
    }
  }

  // Fallback generic recommendation if list is small
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'general_peak_alert',
      title: 'Shift Flexible Operations Out of Peak Hours',
      category: 'timing',
      priority: 'medium',
      why: `Your predicted peak window is ${peakWindow} with maximum demand of ${peakKw.toFixed(1)} kW.`,
      expectedEffect: 'Smooths the load curve and shields you from maximum demand penalties and high time-of-day tariffs.',
      estimatedSavingsMonthly: calcMonthlySavings(dailyKwh * 0.08),
      actionStep: `Reschedule high-power equipment outside of the ${peakWindow} window.`,
    });
  }

  return recommendations;
};
