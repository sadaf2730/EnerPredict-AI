import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import FacilityCard from '../components/FacilityCard';
import { Home, Building, Briefcase, GraduationCap, PartyPopper, Sparkles } from 'lucide-react';

const FACILITIES = [
  {
    id: 'home',
    title: 'Home / Residential',
    subtitle: 'Apartments, villas, and independent houses with domestic appliances and cooling.',
    icon: <Home size={28} />,
    badge: 'RESIDENTIAL',
    examples: ['ACs & Fans', 'Geyser', 'Washing Machine', 'EV Charger'],
    defaultName: 'My Residence',
  },
  {
    id: 'housing_society',
    title: 'Housing Society',
    subtitle: 'Residential complexes with common-area lighting, elevators, and water pumping.',
    icon: <Building size={28} />,
    badge: 'COMMUNITY',
    examples: ['Elevators', 'Water Pumps', 'Common Lighting', 'EV Bays'],
    defaultName: 'Residential Society Complex',
  },
  {
    id: 'office',
    title: 'Office / Corporate',
    subtitle: 'Commercial workspaces, IT setups, HVAC systems, and server infrastructure.',
    icon: <Briefcase size={28} />,
    badge: 'COMMERCIAL',
    examples: ['Workstations', 'Central HVAC', 'Server Room', 'Operating Hours'],
    defaultName: 'Corporate Office HQ',
  },
  {
    id: 'college',
    title: 'College / Institute',
    subtitle: 'Campuses with lecture halls, science & computer laboratories, and hostels.',
    icon: <GraduationCap size={28} />,
    badge: 'EDUCATION',
    examples: ['Classrooms', 'Computer Labs', 'Hostels', 'Exams/Events'],
    defaultName: 'Campus Facility',
  },
  {
    id: 'function_hall',
    title: 'Function / Banquet Hall',
    subtitle: 'Event venues with highly variable loads during weddings, receptions, and galas.',
    icon: <PartyPopper size={28} />,
    badge: 'EVENTS',
    examples: ['Central Cooling', 'Stage Lighting', 'Catering Load', 'Guest Headcount'],
    defaultName: 'Grand Banquet Venue',
  },
];

const FacilitySelection = () => {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const handleSelectFacility = async (facilityType, facilityTitle) => {
    try {
      setLoadingId(facilityType);
      setError('');

      const facilityMeta = FACILITIES.find((f) => f.id === facilityType);
      const facilityName = facilityMeta?.defaultName || `${facilityTitle} Facility`;

      // Call Express POST /api/facilities to create facility in MongoDB
      const res = await apiClient.post('/facilities', {
        facilityType,
        facilityName,
      });

      const newFacility = res.data.facility;

      // Navigate to dynamic input form with created facility
      navigate(`/facility/${newFacility._id}/input`, {
        state: { facility: newFacility },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to initialize facility configuration. Please try again.'
      );
      setLoadingId(null);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '3rem 1.5rem 5rem',
    }}>
      {/* Page Heading */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '1rem',
        }}>
          <Sparkles size={16} />
          <span>STEP 1: SELECT FACILITY PROFILE</span>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
        }}>
          What type of facility do you want to analyze?
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}>
          Our machine-learning engine dynamically tailors the predictive pipeline based on your facility's operational profile and equipment.
        </p>

        {error && (
          <div style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.12)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Facility Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.75rem',
      }}>
        {FACILITIES.map((facility) => (
          <FacilityCard
            key={facility.id}
            id={facility.id}
            title={facility.title}
            subtitle={facility.subtitle}
            icon={facility.icon}
            badge={facility.badge}
            examples={facility.examples}
            onSelect={handleSelectFacility}
            loading={loadingId === facility.id}
          />
        ))}
      </div>
    </div>
  );
};

export default FacilitySelection;
