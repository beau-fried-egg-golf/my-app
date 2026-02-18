import type { FormField } from './types';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
  custom: Record<string, string>;
}

interface Props {
  formFields: FormField[];
  data: FormData;
  onChange: (data: FormData) => void;
}

export default function RegistrationForm({ formFields, data, onChange }: Props) {
  function update(field: keyof Omit<FormData, 'custom'>, value: string) {
    onChange({ ...data, [field]: value });
  }

  function updateCustom(fieldId: string, value: string) {
    onChange({ ...data, custom: { ...data.custom, [fieldId]: value } });
  }

  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Your Information</h3>

      <div className="fegc-form-row">
        <div className="fegc-form-group">
          <label className="fegc-label">First Name *</label>
          <input
            className="fegc-input"
            value={data.first_name}
            onChange={e => update('first_name', e.target.value)}
            required
          />
        </div>
        <div className="fegc-form-group">
          <label className="fegc-label">Last Name *</label>
          <input
            className="fegc-input"
            value={data.last_name}
            onChange={e => update('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="fegc-form-row">
        <div className="fegc-form-group">
          <label className="fegc-label">Email *</label>
          <input
            className="fegc-input"
            type="email"
            value={data.email}
            onChange={e => update('email', e.target.value)}
            required
          />
        </div>
        <div className="fegc-form-group">
          <label className="fegc-label">Phone</label>
          <input
            className="fegc-input"
            type="tel"
            value={data.phone}
            onChange={e => update('phone', e.target.value)}
          />
        </div>
      </div>

      {formFields.map(ff => (
        <div key={ff.id} className="fegc-form-group">
          <label className="fegc-label">
            {ff.label} {ff.required && '*'}
          </label>
          {ff.field_type === 'text' && (
            <input
              className="fegc-input"
              placeholder={ff.placeholder ?? ''}
              value={data.custom[ff.id] ?? ''}
              onChange={e => updateCustom(ff.id, e.target.value)}
              required={ff.required}
            />
          )}
          {ff.field_type === 'number' && (
            <input
              className="fegc-input"
              type="number"
              placeholder={ff.placeholder ?? ''}
              value={data.custom[ff.id] ?? ''}
              onChange={e => updateCustom(ff.id, e.target.value)}
              required={ff.required}
            />
          )}
          {ff.field_type === 'textarea' && (
            <textarea
              className="fegc-input fegc-textarea"
              placeholder={ff.placeholder ?? ''}
              value={data.custom[ff.id] ?? ''}
              onChange={e => updateCustom(ff.id, e.target.value)}
              required={ff.required}
            />
          )}
          {ff.field_type === 'select' && (
            <select
              className="fegc-input"
              value={data.custom[ff.id] ?? ''}
              onChange={e => updateCustom(ff.id, e.target.value)}
              required={ff.required}
            >
              <option value="">Select...</option>
              {(ff.options ?? []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {ff.field_type === 'radio' && (
            <div className="fegc-radio-group">
              {(ff.options ?? []).map(opt => (
                <label key={opt} className="fegc-radio-label">
                  <input
                    type="radio"
                    name={`field-${ff.id}`}
                    value={opt}
                    checked={data.custom[ff.id] === opt}
                    onChange={() => updateCustom(ff.id, opt)}
                    required={ff.required}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {ff.field_type === 'checkbox' && (
            <label className="fegc-checkbox-label">
              <input
                type="checkbox"
                checked={data.custom[ff.id] === 'true'}
                onChange={e => updateCustom(ff.id, e.target.checked ? 'true' : 'false')}
              />
              {ff.placeholder ?? ff.label}
            </label>
          )}
        </div>
      ))}

      <div className="fegc-form-group">
        <label className="fegc-label">Notes</label>
        <textarea
          className="fegc-input fegc-textarea"
          placeholder="Any special requests or notes..."
          value={data.notes}
          onChange={e => update('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
