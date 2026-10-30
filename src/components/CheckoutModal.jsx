import React, { useState } from 'react';

export default function CheckoutModal({ product, isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen || !product) return null;

  const isFree = product.type === 'free';
  const isWaitlist = product.type === 'waitlist';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsProcessing(true);

    // Mock payment gateway handshake (Razorpay / PayPal)
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
    }, 900);
  };

  const handleReset = () => {
    setIsCompleted(false);
    setEmail('');
    setName('');
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleReset}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      data-lenis-prevent
    >
      <div
        className="modal-box"
        style={{ maxWidth: '540px', textAlign: 'left' }}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        <button
          className="modal-close-btn"
          onClick={handleReset}
          aria-label="Close Checkout"
        >
          ✕
        </button>

        {!isCompleted ? (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                className={`product-badge ${
                  isFree ? 'badge-free' : isWaitlist ? 'badge-waitlist' : 'badge-paid'
                }`}
              >
                {product.category}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.8rem',
                  lineHeight: 1.15,
                  margin: '0.4rem 0',
                }}
              >
                {product.name}
              </h3>
              <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-orange)' }}>
                {product.price}
              </p>
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {product.description}
            </p>

            {product.whatInside && (
              <div
                style={{
                  border: '1px solid var(--color-black)',
                  padding: '1rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-white)',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                    borderBottom: '2px solid var(--color-yellow)',
                    paddingBottom: '0.25rem',
                  }}
                >
                  What is included:
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {product.whatInside.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.25rem 0',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ color: 'var(--color-orange)', fontWeight: 'bold' }}>→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Email Address (Download link sent here) *</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!isFree && !isWaitlist && (
                <div className="form-field">
                  <label>Select Payment Gateway</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="razorpay">Razorpay (Cards, UPI, Netbanking, International)</option>
                    <option value="paypal">PayPal (International Payers)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className={`btn ${isFree || isWaitlist ? 'btn-free' : 'btn-paid'}`}
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={isProcessing}
              >
                {isProcessing
                  ? 'Connecting to secure gateway…'
                  : isFree
                  ? 'Download Free PDF Now →'
                  : isWaitlist
                  ? 'Join Priority Waitlist →'
                  : `Complete Payment (${product.price}) →`}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🙌</div>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.9rem',
                marginBottom: '0.75rem',
                lineHeight: 1.2,
              }}
            >
              Order Confirmed!
            </h3>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              We have automatically sent an email to <strong>{email}</strong> containing your secure access and direct PDF download link.
            </p>
            <div
              style={{
                border: '2px solid var(--color-black)',
                padding: '1rem',
                backgroundColor: 'var(--color-yellow)',
                borderRadius: '4px',
                marginBottom: '1.75rem',
                fontSize: '0.9rem',
              }}
            >
              <strong>Product:</strong> {product.name}
              <br />
              <strong>Status:</strong> Digital Download Dispatched
            </div>
            <button
              type="button"
              className="btn btn-paid"
              onClick={handleReset}
              style={{ width: '100%' }}
            >
              Back to Store →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

