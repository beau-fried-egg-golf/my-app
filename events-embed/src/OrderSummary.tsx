import type { TicketType, AddOn } from './types';

interface Props {
  ticket: TicketType | null;
  quantity: number;
  selectedAddOns: AddOn[];
  addOnQuantities: Record<string, number>;
  submitting: boolean;
  onSubmit: () => void;
}

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

export default function OrderSummary({ ticket, quantity, selectedAddOns, addOnQuantities, submitting, onSubmit }: Props) {
  if (!ticket) return null;

  const ticketLineTotal = ticket.price * quantity;
  const addOnTotal = selectedAddOns.reduce((sum, ao) => {
    const aoQty = addOnQuantities[ao.id] ?? 1;
    return sum + ao.price * aoQty;
  }, 0);
  const total = ticketLineTotal + addOnTotal;

  const ticketLabel = quantity > 1 ? `${quantity}x ${ticket.name}` : ticket.name;

  return (
    <div className="fegc-section fegc-order-summary">
      <h3 className="fegc-section-title">Order Summary</h3>

      <div className="fegc-summary-line">
        <span>{ticketLabel}</span>
        <span>{ticketLineTotal === 0 ? 'Free' : formatPrice(ticketLineTotal)}</span>
      </div>

      {selectedAddOns.map(ao => {
        const aoQty = addOnQuantities[ao.id] ?? 1;
        const aoLineTotal = ao.price * aoQty;
        const aoLabel = aoQty > 1 ? `${aoQty}x ${ao.name}` : ao.name;
        return (
          <div key={ao.id} className="fegc-summary-line">
            <span>{aoLabel}</span>
            <span>{aoLineTotal === 0 ? 'Included' : formatPrice(aoLineTotal)}</span>
          </div>
        );
      })}

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
