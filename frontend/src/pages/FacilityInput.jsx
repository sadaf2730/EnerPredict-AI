import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Building2, Thermometer, IndianRupee, Clock, Zap, ArrowLeft, 
  HelpCircle, AlertCircle, Sparkles, CheckCircle2 
} from 'lucide-react';

const FacilityInput = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(location.state?.facility || null);
  const [loadingFacility, setLoadingFacility] = useState(!location.state?.facility);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Dynamic form state
  const [formData, setFormData] = useState({
    temperature: 31.0,
    previous_bill: 0,
    previous_units: '',
    // Home defaults
    family_members: 4,
    ac_units: 2,
    ac_hours: 6.0,
    fan_units: 3,
    fan_hours: 12.0,
    refrigerator_units: 1,
    geyser_hours: 1.0,
    washing_machine_hours: 1.0,
    tv_hours: 3.0,
    ev_charging: 0,
    ev_charging_hours: 0,
    // Society defaults
    total_flats: 80,
    occupied_flats: 72,
    residents: 240,
    lifts: 3,
    lift_usage_level: 2,
    pumps: 2,
    pump_hours: 6.0,
    common_lighting_hours: 10.0,
    gym_pool_active: 1,
    ev_points: 4,
    ev_usage_hours: 4.0,
    cctv_active: 1,
    // Office defaults
    employees: 100,
    employees_present: 90,
    working_hours: 9.0,
    computers: 100,
    computer_hours: 8.0,
    server_active: 1,
    server_hours: 24.0,
    lighting_hours: 9.5,
    heavy_equipment: 0,
    // College defaults
    students: 1200,
    students_present: 1050,
    classrooms: 18,
    labs: 4,
    lab_hours: 4.5,
    hostel_active: 1,
    hostel_occupancy: 350,
    exam_period: 0,
    campus_event: 0,
    event_duration_hours: 0,
    // Function Hall defaults
    event_type: 'Wedding',
    expected_guests: 600,
    event_duration_hours: 7.0,
    decorative_lighting_hours: 6.0,
    catering_active: 1,
    sound_system_active: 1,
  });

  // Fetch facility if not in router state
  useEffect(() => {
    if (!facility && id) {
      apiClient.get(`/facilities/${id}`)
        .then((res) => {
          setFacility(res.data.facility);
          setLoadingFacility(false);
        })
        .catch((err) => {
          setError('Failed to load facility configuration.');
          setLoadingFacility(false);
        });
    }
  }, [id, facility]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error for field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const fType = facility?.facilityType;

    if (formData.temperature < -15 || formData.temperature > 60) {
      errors.temperature = 'Temperature must be between -15°C and 60°C.';
    }

    if (formData.previous_bill < 0) {
      errors.previous_bill = 'Bill amount cannot be negative.';
    }

    // Validate hours
    const hourFields = ['ac_hours', 'working_hours', 'computer_hours', 'pump_hours', 'common_lighting_hours', 'lab_hours', 'event_duration_hours'];
    hourFields.forEach((h) => {
      if (formData[h] !== undefined && (formData[h] < 0 || formData[h] > 24)) {
        errors[h] = 'Hours must be between 0 and 24 hours/day.';
      }
    });

    if (fType === 'office') {
      if (formData.employees <= 0) errors.employees = 'Please enter at least 1 employee.';
      if (formData.employees_present > formData.employees) {
        errors.employees_present = 'Present employees cannot exceed total employees.';
      }
    } else if (fType === 'society') {
      if (formData.total_flats <= 0) errors.total_flats = 'Please enter total flats.';
      if (formData.occupied_flats > formData.total_flats) {
        errors.occupied_flats = 'Occupied flats cannot exceed total flats.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Clean inputs according to selected facility
      const fType = facility.facilityType;
      const inputPayload = {
        facility_type: fType,
        temperature: Number(formData.temperature),
        previous_bill: Number(formData.previous_bill) || 0,
        previous_units: formData.previous_units ? Number(formData.previous_units) : null,
      };

      if (fType === 'home') {
        Object.assign(inputPayload, {
          family_members: Number(formData.family_members),
          ac_units: Number(formData.ac_units),
          ac_hours: Number(formData.ac_hours),
          fan_units: Number(formData.fan_units),
          fan_hours: Number(formData.fan_hours),
          refrigerator_units: Number(formData.refrigerator_units),
          geyser_hours: Number(formData.geyser_hours),
          washing_machine_hours: Number(formData.washing_machine_hours),
          tv_hours: Number(formData.tv_hours),
          ev_charging: Number(formData.ev_charging),
          ev_charging_hours: Number(formData.ev_charging_hours),
        });
      } else if (fType === 'housing_society') {
        Object.assign(inputPayload, {
          total_flats: Number(formData.total_flats),
          occupied_flats: Number(formData.occupied_flats),
          residents: Number(formData.residents),
          lifts: Number(formData.lifts),
          lift_usage_level: Number(formData.lift_usage_level),
          pumps: Number(formData.pumps),
          pump_hours: Number(formData.pump_hours),
          common_lighting_hours: Number(formData.common_lighting_hours),
          gym_pool_active: Number(formData.gym_pool_active),
          ev_points: Number(formData.ev_points),
          ev_usage_hours: Number(formData.ev_usage_hours),
          cctv_active: Number(formData.cctv_active),
        });
      } else if (fType === 'office') {
        Object.assign(inputPayload, {
          employees: Number(formData.employees),
          employees_present: Number(formData.employees_present),
          working_hours: Number(formData.working_hours),
          computers: Number(formData.computers),
          computer_hours: Number(formData.computer_hours),
          ac_units: Number(formData.ac_units),
          ac_hours: Number(formData.ac_hours),
          server_active: Number(formData.server_active),
          server_hours: Number(formData.server_hours),
          lighting_hours: Number(formData.lighting_hours),
          heavy_equipment: Number(formData.heavy_equipment),
          lifts: 2,
        });
      } else if (fType === 'college') {
        Object.assign(inputPayload, {
          students: Number(formData.students),
          students_present: Number(formData.students_present),
          classrooms: Number(formData.classrooms),
          computers: Number(formData.computers || 120),
          computer_hours: Number(formData.computer_hours || 6.0),
          labs: Number(formData.labs),
          lab_hours: Number(formData.lab_hours),
          ac_units: Number(formData.ac_units),
          ac_hours: Number(formData.ac_hours),
          hostel_active: Number(formData.hostel_active),
          hostel_occupancy: Number(formData.hostel_occupancy),
          exam_period: Number(formData.exam_period),
          campus_event: Number(formData.campus_event),
          event_duration_hours: Number(formData.event_duration_hours),
        });
      } else if (fType === 'function_hall') {
        Object.assign(inputPayload, {
          event_type: formData.event_type,
          expected_guests: Number(formData.expected_guests),
          event_duration_hours: Number(formData.event_duration_hours),
          ac_units: Number(formData.ac_units),
          ac_hours: Number(formData.ac_hours),
          decorative_lighting_hours: Number(formData.decorative_lighting_hours),
          catering_active: Number(formData.catering_active),
          sound_system_active: Number(formData.sound_system_active),
        });
      }

      // Dispatch to Express backend
      const res = await apiClient.post('/predictions', {
        facilityId: facility._id,
        inputData: inputPayload,
      });

      const prediction = res.data.prediction;

      // Navigate to personalized energy intelligence dashboard
      navigate(`/dashboard/${facility._id}`, {
        state: { prediction, facility, inputPayload },
      });
    } catch (err) {
      if (err.response?.status === 503) {
        setError('The ML prediction service is temporarily unavailable. Please verify FastAPI is running and try again shortly.');
      } else {
        setError(err.response?.data?.message || 'Failed to generate prediction. Please check inputs and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFacility) {
    return <LoadingSpinner text="Loading facility profile..." />;
  }

  const fType = facility?.facilityType || 'office';

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem 5rem',
    }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/facilities')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          fontWeight: '500',
          marginBottom: '1.5rem',
          padding: '6px 0',
        }}
      >
        <ArrowLeft size={16} />
        <span>Switch Facility Profile</span>
      </button>

      {/* Header Banner */}
      <div className="glass-panel facility-hero-card" style={{
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="facility-hero-title" style={{ fontSize: '1.75rem', fontWeight: '800' }}>
              {facility?.facilityName || 'Facility Details'}
            </h1>
            <span className="facility-hero-profile" style={{ fontSize: '0.85rem' }}>
              Profile: <strong>{fType.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>

        {/* Helpful non-technical explanation */}
        <div className="facility-info-banner">
          <HelpCircle size={18} className="facility-info-banner-icon" />
          <span>
            <strong>Don't know your exact electricity consumption? That's completely okay.</strong> Enter the everyday equipment and operating hours you know, and our trained machine learning model will estimate your demand and peak risk.
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          marginBottom: '2rem',
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Submitting Loading Overlay */}
      {submitting ? (
        <div className="glass-panel" style={{ padding: '3rem 1rem' }}>
          <LoadingSpinner text="Evaluating facility features with Gradient Boosting Regressor..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 1. Universal Section: Bill & Weather */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>
              Historical Context & Weather
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Previous Month's Electricity Bill (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                    <IndianRupee size={16} />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.previous_bill}
                    onChange={(e) => handleChange('previous_bill', e.target.value)}
                    placeholder="e.g. 72000"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: validationErrors.previous_bill ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>
                {validationErrors.previous_bill && (
                  <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem' }}>{validationErrors.previous_bill}</span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Previous Month's Electricity Units (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.previous_units}
                  onChange={(e) => handleChange('previous_units', e.target.value)}
                  placeholder="Optional kWh units"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Expected Ambient Temperature (°C)
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                    <Thermometer size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.temperature}
                    onChange={(e) => handleChange('temperature', e.target.value)}
                    placeholder="e.g. 31.4"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: validationErrors.temperature ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>
                {validationErrors.temperature && (
                  <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem' }}>{validationErrors.temperature}</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Facility-Specific Dynamic Fields */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>
              {fType === 'home' && 'Household Appliances & Cooling'}
              {fType === 'housing_society' && 'Common Infrastructure & Resident Details'}
              {fType === 'office' && 'Workforce, Computers & HVAC Operations'}
              {fType === 'college' && 'Campus Facilities, Labs & Academic Schedule'}
              {fType === 'function_hall' && 'Event Specifics, Lighting & Audio/Catering'}
            </h2>

            {/* HOME FIELDS */}
            {fType === 'home' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Family Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.family_members}
                    onChange={(e) => handleChange('family_members', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Number of Air Conditioners (ACs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ac_units}
                    onChange={(e) => handleChange('ac_units', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Hours ACs are ON per day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.ac_hours}
                    onChange={(e) => handleChange('ac_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Ceiling Fans Running
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.fan_units}
                    onChange={(e) => handleChange('fan_units', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Geyser Operating Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.geyser_hours}
                    onChange={(e) => handleChange('geyser_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Washing Machine Usage Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.washing_machine_hours}
                    onChange={(e) => handleChange('washing_machine_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
            )}

            {/* HOUSING SOCIETY FIELDS */}
            {fType === 'housing_society' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Total Flats in Complex
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_flats}
                    onChange={(e) => handleChange('total_flats', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Occupied Flats
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.occupied_flats}
                    onChange={(e) => handleChange('occupied_flats', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Number of Elevators / Lifts
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lifts}
                    onChange={(e) => handleChange('lifts', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Water Pumps
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pumps}
                    onChange={(e) => handleChange('pumps', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Pump Operating Hours / Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.pump_hours}
                    onChange={(e) => handleChange('pump_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Common EV Charging Bays
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ev_points}
                    onChange={(e) => handleChange('ev_points', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
            )}

            {/* OFFICE FIELDS */}
            {fType === 'office' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    👥 Total Employees
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.employees}
                    onChange={(e) => handleChange('employees', e.target.value)}
                    placeholder="e.g. 137"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Employees Present Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.employees_present}
                    onChange={(e) => handleChange('employees_present', e.target.value)}
                    placeholder="e.g. 128"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    💻 Number of Computers / Desktops
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.computers}
                    onChange={(e) => handleChange('computers', e.target.value)}
                    placeholder="e.g. 96"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Computer Usage Hours / Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.computer_hours}
                    onChange={(e) => handleChange('computer_hours', e.target.value)}
                    placeholder="e.g. 8.5"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    ❄️ Number of Air Conditioners (ACs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ac_units}
                    onChange={(e) => handleChange('ac_units', e.target.value)}
                    placeholder="e.g. 7"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Approx. Hours ACs are ON
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.ac_hours}
                    onChange={(e) => handleChange('ac_hours', e.target.value)}
                    placeholder="e.g. 6.5"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Office Operating / Working Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.working_hours}
                    onChange={(e) => handleChange('working_hours', e.target.value)}
                    placeholder="e.g. 9.0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Dedicated Server Room Active?
                  </label>
                  <select
                    value={formData.server_active}
                    onChange={(e) => handleChange('server_active', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  >
                    <option value={1}>Yes, Active 24/7</option>
                    <option value={0}>No Dedicated Server Room</option>
                  </select>
                </div>
              </div>
            )}

            {/* COLLEGE FIELDS */}
            {fType === 'college' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Total Enrolled Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.students}
                    onChange={(e) => handleChange('students', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Number of Classrooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.classrooms}
                    onChange={(e) => handleChange('classrooms', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Number of Science / Engg Labs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.labs}
                    onChange={(e) => handleChange('labs', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Lab Operating Hours / Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.lab_hours}
                    onChange={(e) => handleChange('lab_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Currently Exam Period?
                  </label>
                  <select
                    value={formData.exam_period}
                    onChange={(e) => handleChange('exam_period', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  >
                    <option value={0}>No (Regular Semester)</option>
                    <option value={1}>Yes (Active Examinations)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Hostel Occupancy (Students)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hostel_occupancy}
                    onChange={(e) => handleChange('hostel_occupancy', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
            )}

            {/* FUNCTION HALL FIELDS */}
            {fType === 'function_hall' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Event Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => handleChange('event_type', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Reception">Reception</option>
                    <option value="Birthday">Birthday / Anniversary</option>
                    <option value="Corporate">Corporate Conference</option>
                    <option value="None">None (Maintenance Day)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Expected Guests
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.expected_guests}
                    onChange={(e) => handleChange('expected_guests', e.target.value)}
                    placeholder="e.g. 650"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Event Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.event_duration_hours}
                    onChange={(e) => handleChange('event_duration_hours', e.target.value)}
                    placeholder="e.g. 7.0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Number of AC Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ac_units}
                    onChange={(e) => handleChange('ac_units', e.target.value)}
                    placeholder="e.g. 12"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Decorative / Stage Lighting Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.decorative_lighting_hours}
                    onChange={(e) => handleChange('decorative_lighting_hours', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    Catering & Kitchen Equipment Active?
                  </label>
                  <select
                    value={formData.catering_active}
                    onChange={(e) => handleChange('catering_active', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                  >
                    <option value={1}>Yes, Heavy Food Warmers & Prep</option>
                    <option value={0}>No / External Packaged</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 36px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
            >
              <Zap size={22} fill="#fff" />
              <span>Predict My Energy Demand</span>
            </button>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
              Submits directly to trained Gradient Boosting Regressor (No canned/hardcoded formulas)
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default FacilityInput;
