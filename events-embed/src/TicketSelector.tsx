import type { TicketType } from './types';

interface Props {
  ticketTypes: TicketType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  unlockedTicketIds: Set<string>;
  ticketCodeInputs: Record<string, string>;
  onCodeChange: (ticketId: string, code: string) => void;
  onCodeSubmit: (ticketId: string) => void;
  codeErrors: Record<string, string>;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return '$' + (cents / 100).toLocaleString();
}

export default function TicketSelector({
  ticketTypes, selectedId, onSelect, quantity, onQuantityChange,
  unlockedTicketIds, ticketCodeInputs, onCodeChange, onCodeSubmit, codeErrors,
}: Props) {
  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Select Ticket</h3>
      <div className="fegc-ticket-list">
        {ticketTypes.map(tt => {
          const soldOut = tt.available !== null && tt.available <= 0;
          const notOnSale = tt.sale_status === 'not_started';
          const saleEnded = tt.sale_status === 'ended';
          const locked = tt.requires_code && !unlockedTicketIds.has(tt.id);
          const disabled = soldOut || notOnSale || saleEnded || locked;
          const isSelected = selectedId === tt.id;
          const showQty = isSelected && tt.max_per_order > 1;

          return (
            <div key={tt.id}>
              <label
                className={`fegc-ticket-option${isSelected ? ' selected' : ''}${disabled ? ' sold-out' : ''}${showQty ? ' has-qty' : ''}${locked ? ' locked' : ''}`}
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
                    {locked && <span className="fegc-lock-icon">&#128274;</span>}
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
                <div className="fegc-ticket-price">{!disabled || locked ? formatPrice(tt.price) : ''}</div>
              </label>
              {locked && !soldOut && !notOnSale && !saleEnded && (
                <div className="fegc-code-input-row">
                  <input
                    type="text"
                    className="fegc-code-input"
                    placeholder="Enter access code"
                    value={ticketCodeInputs[tt.id] ?? ''}
                    onChange={e => onCodeChange(tt.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCodeSubmit(tt.id); } }}
                  />
                  <button
                    type="button"
                    className="fegc-code-btn"
                    onClick={() => onCodeSubmit(tt.id)}
                  >
                    Unlock
                  </button>
                  {codeErrors[tt.id] && <div className="fegc-code-error">{codeErrors[tt.id]}</div>}
                </div>
              )}
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
