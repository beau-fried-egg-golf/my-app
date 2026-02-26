import type { AddOn, AddOnGroup } from './types';

interface Props {
  addOnGroups: AddOnGroup[];
  addOns: AddOn[];
  selectedIds: string[];
  addOnQuantities: Record<string, number>;
  onToggle: (id: string) => void;
  onSelectOne: (groupId: string, addOnId: string) => void;
  onAddOnQtyChange: (id: string, qty: number) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Included';
  return '+$' + (cents / 100).toLocaleString();
}

function AddOnCard({ ao, isSelected, soldOut, inputType, inputName, onToggle, addOnQuantities, onAddOnQtyChange }: {
  ao: AddOn;
  isSelected: boolean;
  soldOut: boolean;
  inputType: 'checkbox' | 'radio';
  inputName?: string;
  onToggle: () => void;
  addOnQuantities: Record<string, number>;
  onAddOnQtyChange: (id: string, qty: number) => void;
}) {
  const qty = addOnQuantities[ao.id] ?? 1;
  // Cap stepper at the lesser of max_per_order and available capacity
  const maxQty = ao.available !== null ? Math.min(ao.max_per_order, ao.available) : ao.max_per_order;
  const showQty = isSelected && maxQty > 1;

  return (
    <div>
      <label className={`fegc-addon-option${isSelected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}${showQty ? ' has-qty' : ''}`}>
        <input
          type={inputType}
          name={inputName}
          checked={isSelected}
          onChange={onToggle}
          disabled={inputType === 'checkbox' ? ((soldOut && !isSelected) || ao.required) : soldOut}
        />
        <div className="fegc-addon-info">
          <span className="fegc-addon-name">
            {ao.name}
            {ao.required && <span className="fegc-required-tag">Required</span>}
          </span>
          {ao.description && <span className="fegc-addon-desc">{ao.description}</span>}
          {soldOut && <span className="fegc-badge-sold-out">Sold Out</span>}
          {!soldOut && ao.available !== null && (
            <span className="fegc-addon-avail">{ao.available} remaining</span>
          )}
        </div>
        <span className="fegc-addon-price">{formatPrice(ao.price)}</span>
      </label>
      {showQty && (
        <div className="fegc-qty-stepper fegc-qty-inline">
          <span className="fegc-qty-label">Quantity</span>
          <button
            type="button"
            className="fegc-qty-btn"
            disabled={qty <= 1}
            onClick={() => onAddOnQtyChange(ao.id, qty - 1)}
          >
            &minus;
          </button>
          <span className="fegc-qty-value">{qty}</span>
          <button
            type="button"
            className="fegc-qty-btn"
            disabled={qty >= maxQty}
            onClick={() => onAddOnQtyChange(ao.id, qty + 1)}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddOnSelector({ addOnGroups, addOns, selectedIds, addOnQuantities, onToggle, onSelectOne, onAddOnQtyChange }: Props) {
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

              return (
                <AddOnCard
                  key={ao.id}
                  ao={ao}
                  isSelected={isSelected}
                  soldOut={soldOut}
                  inputType={group.selection_type === 'one_only' ? 'radio' : 'checkbox'}
                  inputName={group.selection_type === 'one_only' ? `addon-group-${group.id}` : undefined}
                  onToggle={() => group.selection_type === 'one_only' ? onSelectOne(group.id, ao.id) : onToggle(ao.id)}
                  addOnQuantities={addOnQuantities}
                  onAddOnQtyChange={onAddOnQtyChange}
                />
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
              <AddOnCard
                key={ao.id}
                ao={ao}
                isSelected={isSelected}
                soldOut={soldOut}
                inputType="checkbox"
                onToggle={() => !ao.required && onToggle(ao.id)}
                addOnQuantities={addOnQuantities}
                onAddOnQtyChange={onAddOnQtyChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
