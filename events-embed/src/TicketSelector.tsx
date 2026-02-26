import type { TicketType } from './types';

interface Props {
  ticketTypes: TicketType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return '$' + (cents / 100).toLocaleString();
}

export default function TicketSelector({ ticketTypes, selectedId, onSelect, quantity, onQuantityChange }: Props) {
  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Select Ticket</h3>
      <div className="fegc-ticket-list">
        {ticketTypes.map(tt => {
          const soldOut = tt.available !== null && tt.available <= 0;
          const notOnSale = tt.sale_status === 'not_started';
          const saleEnded = tt.sale_status === 'ended';
          const disabled = soldOut || notOnSale || saleEnded;
          const isSelected = selectedId === tt.id;
          const showQty = isSelected && tt.max_per_order > 1;

          return (
            <div key={tt.id}>
              <label
                className={`fegc-ticket-option${isSelected ? ' selected' : ''}${disabled ? ' sold-out' : ''}${showQty ? ' has-qty' : ''}`}
              >
                <input
                  type="radio"
                  name="ticket"
                  value={tt.id}
                  checked={isSelected}
                  onChange={() => onSelect(tt.id)}
                  disabled={disabled}
                />
                <div className="fegc-ticket-info">
                  <div className="fegc-ticket-name">
                    {tt.name}
                    {soldOut && <span className="fegc-badge-sold-out">Sold Out</span>}
                    {!soldOut && notOnSale && <span className="fegc-badge-coming-soon">Coming Soon</span>}
                    {!soldOut && saleEnded && <span className="fegc-badge-sale-ended">Sale Ended</span>}
                  </div>
                  {tt.description && <div className="fegc-ticket-desc">{tt.description}</div>}
                  {tt.available !== null && !disabled && (
                    <div className="fegc-ticket-avail">{tt.available} remaining</div>
                  )}
                </div>
                <div className="fegc-ticket-price">{!disabled ? formatPrice(tt.price) : ''}</div>
              </label>
              {showQty && (
                <div className="fegc-qty-stepper fegc-qty-inline">
                  <span className="fegc-qty-label">Quantity</span>
                  <button
                    type="button"
                    className="fegc-qty-btn"
                    disabled={quantity <= (tt.min_per_order || 1)}
                    onClick={() => onQuantityChange(quantity - 1)}
                  >
                    &minus;
                  </button>
                  <span className="fegc-qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="fegc-qty-btn"
                    disabled={quantity >= tt.max_per_order}
                    onClick={() => onQuantityChange(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
