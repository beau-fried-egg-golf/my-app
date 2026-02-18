import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLocations, getPackages, getReservations } from './experienceStorage';
import type { ExperienceLocation, ExperiencePackage, ExperienceReservation } from './types';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExperiencesDashboard() {
  const [locations, setLocations] = useState<ExperienceLocation[]>([]);
  const [packages, setPackages] = useState<ExperiencePackage[]>([]);
  const [reservations, setReservations] = useState<ExperienceReservation[]>([]);

  useEffect(() => {
    getLocations().then(setLocations);
    getPackages().then(setPackages);
    getReservations().then(setReservations);
  }, []);

  const confirmedRevenue = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'completed')
    .reduce((sum, r) => sum + r.total_price, 0);

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const recentReservations = reservations.slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Experiences</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Locations</div>
          <div className="stat-value">{locations.length}</div>
          <div className="stat-detail">{locations.filter(l => l.is_active).length} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Packages</div>
          <div className="stat-value">{packages.length}</div>
          <div className="stat-detail">{packages.filter(p => p.is_featured).length} featured</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reservations</div>
          <div className="stat-value">{reservations.length}</div>
          <div className="stat-detail">{pendingCount} pending · {confirmedCount} confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">{formatCents(confirmedRevenue)}</div>
          <div className="stat-detail">Confirmed + completed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Quick links */}
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>Quick Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/experiences/locations" className="btn">Manage Locations</Link>
            <Link to="/experiences/packages" className="btn">Manage Packages</Link>
            <Link to="/experiences/reservations" className="btn">View Reservations</Link>
          </div>
        </div>

        {/* Recent bookings */}
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>Recent Reservations</h2>
          {recentReservations.length > 0 ? (
            <div className="activity-list">
              {recentReservations.map(r => (
                <div className="activity-item" key={r.id}>
                  <div style={{ flex: 1 }}>
                    <strong>{r.user_name}</strong>
                    <span style={{ color: '#888' }}> · {r.type.replace('_', ' ')} · {formatCents(r.total_price)}</span>
                  </div>
                  <span className="activity-time">{formatDate(r.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No reservations yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
