import type { TicketType, AddOn } from './types';

interface Props {
  ticket: TicketType | null;
  selectedAddOns: AddOn[];
  submitting: boolean;
  onSubmit: () => void;
}

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

export default function OrderSummary({ ticket, selectedAddOns, submitting, onSubmit }: Props) {
  if (!ticket) return null;

  const ticketTotal = ticket.price;
  const addOnTotal = selectedAddOns.reduce((sum, ao) => sum + ao.price, 0);
  const total = ticketTotal + addOnTotal;

  return (
    <div className="fegc-section fegc-order-summary">
      <h3 className="fegc-section-title">Order Summary</h3>

      <div className="fegc-summary-line">
        <span>{ticket.name}</span>
        <span>{ticket.price === 0 ? 'Free' : formatPrice(ticket.price)}</span>
      </div>

      {selectedAddOns.map(ao => (
        <div key={ao.id} className="fegc-summary-line">
          <span>{ao.name}</span>
          <span>{ao.price === 0 ? 'Included' : formatPrice(ao.price)}</span>
        </div>
      ))}

      <div className="fegc-summary-total">
        <span>Total</span>
        <span>{total === 0 ? 'Free' : formatPrice(total)}</span>
      </div>

      <button
        className="fegc-submit-btn"
        onClick={onSubmit}
        disabled={submitting}
      >
        {submitting
          ? 'Processing...'
          : total === 0
            ? 'Complete Registration'
            : `Pay ${formatPrice(total)}`}
      </button>
    </div>
  );
}
