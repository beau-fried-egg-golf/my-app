import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLocations, deleteLocation } from './experienceStorage';
import type { ExperienceLocation } from './types';

export default function LocationList() {
  const [locations, setLocations] = useState<ExperienceLocation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getLocations().then(setLocations);
  }, []);

  async function handleDelete(id: string) {
    const loc = locations.find(l => l.id === id);
    if (loc && loc.room_type_count && loc.room_type_count > 0) {
      if (!window.confirm(`This location has ${loc.room_type_count} room type(s). Delete anyway?`)) {
        return;
      }
    }
    await deleteLocation(id);
    setLocations(locations.filter(l => l.id !== id));
    setDeleteId(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <button className="btn btn-primary" onClick={() => navigate('/experiences/locations/new')}>
          + Add Location
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>City</th>
              <th>Room Types</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.id}>
                <td><strong>{loc.name}</strong></td>
                <td>
                  <span className="badge" style={{
                    background: loc.type === 'resort' ? '#dbeafe' : loc.type === 'lodge' ? '#dcfce7' : '#f3f4f6',
                    color: loc.type === 'resort' ? '#1e40af' : loc.type === 'lodge' ? '#166534' : '#4b5563',
                  }}>
                    {loc.type}
                  </span>
                </td>
                <td>{loc.city}{loc.state ? `, ${loc.state}` : ''}</td>
                <td>{loc.room_type_count ?? 0}</td>
                <td>
                  <span className={`badge ${loc.is_active ? 'badge-visible' : 'badge-hidden'}`}>
                    {loc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <Link to={`/experiences/locations/${loc.id}/edit`} className="btn btn-sm">Edit</Link>
                    <Link to={`/experiences/locations/${loc.id}/rooms`} className="btn btn-sm">Rooms</Link>
                    <Link to={`/experiences/locations/${loc.id}/inventory`} className="btn btn-sm">Inventory</Link>
                    {deleteId === loc.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(loc.id)}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(loc.id)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {locations.length === 0 && <div className="empty-state">No locations yet</div>}
      </div>
    </div>
  );
}
