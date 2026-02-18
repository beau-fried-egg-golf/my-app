import type { TicketType } from './types';

interface Props {
  ticketTypes: TicketType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return '$' + (cents / 100).toLocaleString();
}

export default function TicketSelector({ ticketTypes, selectedId, onSelect }: Props) {
  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Select Ticket</h3>
      <div className="fegc-ticket-list">
        {ticketTypes.map(tt => {
          const soldOut = tt.available !== null && tt.available <= 0;
          const isSelected = selectedId === tt.id;

          return (
            <label
              key={tt.id}
              className={`fegc-ticket-option${isSelected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}
            >
              <input
                type="radio"
                name="ticket"
                value={tt.id}
                checked={isSelected}
                onChange={() => onSelect(tt.id)}
                disabled={soldOut}
              />
              <div className="fegc-ticket-info">
                <div className="fegc-ticket-name">
                  {tt.name}
                  {soldOut && <span className="fegc-badge-sold-out">Sold Out</span>}
                </div>
                {tt.description && <div className="fegc-ticket-desc">{tt.description}</div>}
                {tt.available !== null && !soldOut && (
                  <div className="fegc-ticket-avail">{tt.available} remaining</div>
                )}
              </div>
              <div className="fegc-ticket-price">{formatPrice(tt.price)}</div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
