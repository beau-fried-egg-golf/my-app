import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPackages, deletePackage } from './experienceStorage';
import type { ExperiencePackage } from './types';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

export default function PackageList() {
  const [packages, setPackages] = useState<ExperiencePackage[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getPackages().then(setPackages);
  }, []);

  async function handleDelete(id: string) {
    await deletePackage(id);
    setPackages(packages.filter(p => p.id !== id));
    setDeleteId(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Packages</h1>
        <button className="btn btn-primary" onClick={() => navigate('/experiences/packages/new')}>
          + Add Package
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Price/Person</th>
              <th>Nights</th>
              <th>Group Size</th>
              <th>Featured</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg => (
              <tr key={pkg.id}>
                <td><strong>{pkg.name}</strong></td>
                <td>{pkg.location_name ?? '–'}</td>
                <td>{formatCents(pkg.price_per_person)}</td>
                <td>{pkg.duration_nights}</td>
                <td>{pkg.min_group_size}–{pkg.max_group_size}</td>
                <td>
                  {pkg.is_featured ? (
                    <span style={{ backgroundColor: '#FFEE54', color: '#000', fontWeight: 'bold', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>Featured</span>
                  ) : '–'}
                </td>
                <td>
                  <span className={`badge ${pkg.is_active ? 'badge-visible' : 'badge-hidden'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <Link to={`/experiences/packages/${pkg.id}/edit`} className="btn btn-sm">Edit</Link>
                    {deleteId === pkg.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(pkg.id)}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(pkg.id)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packages.length === 0 && <div className="empty-state">No packages yet</div>}
      </div>
    </div>
  );
}
