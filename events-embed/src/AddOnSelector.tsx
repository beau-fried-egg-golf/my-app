import type { AddOn, AddOnGroup } from './types';

interface Props {
  addOnGroups: AddOnGroup[];
  addOns: AddOn[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectOne: (groupId: string, addOnId: string) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Included';
  return '+$' + (cents / 100).toLocaleString();
}

export default function AddOnSelector({ addOnGroups, addOns, selectedIds, onToggle, onSelectOne }: Props) {
  if (addOns.length === 0) return null;

  // Group add-ons
  const ungrouped = addOns.filter(a => !a.add_on_group_id);
  const grouped = addOnGroups.map(g => ({
    ...g,
    items: addOns.filter(a => a.add_on_group_id === g.id),
  }));

  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Add-Ons</h3>

      {grouped.map(group => (
        <div key={group.id} className="fegc-addon-group">
          <div className="fegc-addon-group-name">{group.name}</div>
          {group.description && <div className="fegc-addon-group-desc">{group.description}</div>}
          <div className="fegc-addon-list">
            {group.items.map(ao => {
              const soldOut = ao.available !== null && ao.available <= 0;
              const isSelected = selectedIds.includes(ao.id);

              if (group.selection_type === 'one_only') {
                return (
                  <label key={ao.id} className={`fegc-addon-option${isSelected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}>
                    <input
                      type="radio"
                      name={`addon-group-${group.id}`}
                      checked={isSelected}
                      onChange={() => onSelectOne(group.id, ao.id)}
                      disabled={soldOut}
                    />
                    <div className="fegc-addon-info">
                      <span className="fegc-addon-name">{ao.name}</span>
                      {ao.description && <span className="fegc-addon-desc">{ao.description}</span>}
                      {soldOut && <span className="fegc-badge-sold-out">Sold Out</span>}
                    </div>
                    <span className="fegc-addon-price">{formatPrice(ao.price)}</span>
                  </label>
                );
              }

              return (
                <label key={ao.id} className={`fegc-addon-option${isSelected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(ao.id)}
                    disabled={soldOut && !isSelected}
                  />
                  <div className="fegc-addon-info">
                    <span className="fegc-addon-name">{ao.name}</span>
                    {ao.description && <span className="fegc-addon-desc">{ao.description}</span>}
                    {soldOut && <span className="fegc-badge-sold-out">Sold Out</span>}
                  </div>
                  <span className="fegc-addon-price">{formatPrice(ao.price)}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="fegc-addon-list">
          {ungrouped.map(ao => {
            const soldOut = ao.available !== null && ao.available <= 0;
            const isSelected = selectedIds.includes(ao.id);
            return (
              <label key={ao.id} className={`fegc-addon-option${isSelected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}>
                <input
                  type="checkbox"
                  checked={isSelected || ao.required}
                  onChange={() => !ao.required && onToggle(ao.id)}
                  disabled={(soldOut && !isSelected) || ao.required}
                />
                <div className="fegc-addon-info">
                  <span className="fegc-addon-name">
                    {ao.name}
                    {ao.required && <span className="fegc-required-tag">Required</span>}
                  </span>
                  {ao.description && <span className="fegc-addon-desc">{ao.description}</span>}
                </div>
                <span className="fegc-addon-price">{formatPrice(ao.price)}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
