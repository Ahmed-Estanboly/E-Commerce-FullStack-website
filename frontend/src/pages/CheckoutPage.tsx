import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CheckoutFormData, CheckoutStep, ConfirmedOrder, FormErrors, Branch } from '../types/checkout';
import { OrderSummaryCard } from '../components/checkout/OrderSummaryCard';
import { OrderConfirmationView } from '../components/checkout/OrderConfirmationView';
import { useCart } from '../store/cart-context';

const BRANCHES: Branch[] = [
  { id: 0, slug: 'north-house', name: 'North House', city: 'Dublin · N01', manager: 'Ava Byrne' },
  { id: 1, slug: 'central-house', name: 'Central House', city: 'Cork · C02', manager: 'Noah Walsh' },
  { id: 2, slug: 'south-house', name: 'South House', city: 'Galway · G03', manager: 'Mia Kelly' },
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, subtotal, removeItem } = useCart();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: 'hello@nova.demo',
    phone: '+32 470 55 01 18',
    fulfilment: 'collect',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    paymentMethod: 'card',
    cardNumber: '4242 4242 4242 4242',
    expiry: '04 / 29',
    cvc: '123',
    nameOnCard: 'Elin Marchetti',
    acceptedTerms: true,
  });

  const activeBranch = useMemo(
    () => BRANCHES.find((b) => b.id === selectedBranchId) ?? BRANCHES[0],
    [selectedBranchId]
  );

  const shippingFee = formData.fulfilment === 'deliver' ? 6.5 : 0;
  const total = subtotal + shippingFee;

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    }
    return digits;
  };

  const handleFieldChange = <K extends keyof CheckoutFormData>(
    key: K,
    value: CheckoutFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (formData.phone.replace(/\D/g, '').length < 8) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (formData.fulfilment === 'deliver') {
      if (!formData.deliveryAddress.trim()) {
        nextErrors.deliveryAddress = 'Street address is required for delivery.';
      }
      if (!formData.deliveryCity.trim()) {
        nextErrors.deliveryCity = 'City is required.';
      }
      if (!formData.deliveryPostalCode.trim()) {
        nextErrors.deliveryPostalCode = 'Postal code is required.';
      }
    }

    if (formData.paymentMethod === 'card') {
      const rawCard = formData.cardNumber.replace(/\s/g, '');
      if (rawCard.length !== 16) {
        nextErrors.cardNumber = 'Enter a 16-digit demo card number.';
      }

      const expParts = formData.expiry.split('/').map((s) => s.trim());
      const month = Number(expParts[0]);
      const year = Number(expParts[1]);
      const currentYear = 26;
      const currentMonth = 11;

      if (
        expParts.length !== 2 ||
        Number.isNaN(month) ||
        Number.isNaN(year) ||
        month < 1 ||
        month > 12 ||
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        nextErrors.expiry = 'Use a future MM / YY date.';
      }

      if (!/^\d{3,4}$/.test(formData.cvc.trim())) {
        nextErrors.cvc = 'Enter a 3- or 4-digit security code.';
      }

      if (!formData.nameOnCard.trim()) {
        nextErrors.nameOnCard = 'Cardholder name is required.';
      }
    }

    if (!formData.acceptedTerms) {
      nextErrors.acceptedTerms = 'Please accept the demo terms to continue.';
    }

    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    const firstName =
      formData.nameOnCard.trim().split(/\s+/)[0] ||
      formData.email.split('@')[0] ||
      'Guest';

    const digits = formData.cardNumber.replace(/\s/g, '');
    const order: ConfirmedOrder = {
      orderNumber: `NOVA-${Math.floor(1000 + Math.random() * 9000)}`,
      customerFirstName: firstName,
      items: [...items],
      subtotal,
      shippingFee,
      total,
      fulfilment: formData.fulfilment,
      branch: activeBranch,
      deliveryAddress:
        formData.fulfilment === 'deliver'
          ? `${formData.deliveryAddress}, ${formData.deliveryPostalCode} ${formData.deliveryCity}`
          : undefined,
      paymentMethod: formData.paymentMethod,
      cardLast4: digits.slice(-4) || '4242',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConfirmedOrder(order);
    setStep('confirmation');

    // تفريغ السلة عبر استدعاء removeItem لكل منتج باستخدام useCart
    items.forEach((item) => removeItem(item.product.id));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasErrors = Object.keys(errors).length > 0;

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="container-nova py-20 text-center">
        <h1 className="display-title text-ink">Your bag is empty.</h1>
        <p className="mt-2 text-sm text-muted">Add items to your bag before proceeding to checkout.</p>
        <Link to="/shop" className="mt-6 inline-block bg-accent px-6 py-3 font-mono text-xs uppercase text-accent-ink">
          Explore the shop
        </Link>
      </div>
    );
  }

  if (step === 'confirmation' && confirmedOrder) {
    return (
      <OrderConfirmationView
        order={confirmedOrder}
        onContinueShopping={() => navigate('/shop')}
        onReturnHome={() => navigate('/')}
      />
    );
  }

  return (
    <div className="page-enter pb-20">
      <div className="border-b border-line pt-8 pb-7">
        <div className="container-nova">
          <nav aria-label="Breadcrumb" className="eyebrow">
            HOME <span className="mx-1.5">/</span> BAG <span className="mx-1.5">/</span>{' '}
            <span className="text-ink">CHECKOUT</span>
          </nav>

          <p className="eyebrow mt-5">— STEP 02 OF 03</p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h1 className="display-title text-ink">
              Checkout<span className="text-[#9ec200] dark:text-accent">.</span>
            </h1>

            <p className="max-w-xs text-xs leading-relaxed text-muted">
              A demo checkout. No payment is taken, no card is stored, and no order leaves this
              browser. Every field is validated as it would be in production.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-line py-4">
        <div className="container-nova flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-medium text-accent-ink">01</span>
              <span className="eyebrow-strong">BAG</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-medium text-accent-ink">02</span>
              <span className="eyebrow-strong">DETAILS</span>
            </div>
            <div className="flex items-center gap-2 opacity-60">
              <span className="border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted">03</span>
              <span className="eyebrow">CONFIRMATION</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow">BRANCH:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="border border-line-strong bg-surface px-2.5 py-1 font-mono text-[10px] uppercase text-ink"
            >
              {BRANCHES.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="container-nova pt-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <form onSubmit={handleSubmit} noValidate className="space-y-10 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3 border border-line bg-accent-soft/50 px-4 py-3">
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-medium text-accent-ink uppercase">DEMO</span>
              <p className="eyebrow text-[9px] text-ink-soft">
                NOTHING IS CHARGED. USE ANY WELL-FORMED EMAIL AND CARD DETAILS. THE ORDER IS SIMULATED.
              </p>
            </div>

            {hasErrors && (
              <div role="alert" className="flex items-start gap-3 border border-danger bg-danger-soft px-4 py-3 text-xs text-danger">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-danger font-mono text-[10px] font-bold">!</span>
                <p><strong>Check the highlighted fields.</strong> Please fix the errors below before placing the demo order.</p>
              </div>
            )}

            <section>
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <h2 className="display-sub text-ink">Contact</h2>
                <span className="eyebrow">01 / 04</span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="eyebrow block">EMAIL</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink outline-none ${errors.email ? 'border-danger' : 'border-line'}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="eyebrow block">PHONE</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink outline-none ${errors.phone ? 'border-danger' : 'border-line'}`}
                  />
                  {errors.phone && <p className="mt-1.5 text-xs text-danger">{errors.phone}</p>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <h2 className="display-sub text-ink">Fulfilment</h2>
                <span className="eyebrow">02 / 04</span>
              </div>
              <div className="mt-5 grid grid-cols-2 border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => handleFieldChange('fulfilment', 'collect')}
                  className={`h-10 font-mono text-[10px] uppercase transition ${formData.fulfilment === 'collect' ? 'bg-inverse text-inverse-ink' : 'text-muted'}`}
                >
                  COLLECT · FREE
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('fulfilment', 'deliver')}
                  className={`h-10 border-l border-line font-mono text-[10px] uppercase transition ${formData.fulfilment === 'deliver' ? 'bg-inverse text-inverse-ink' : 'text-muted'}`}
                >
                  DELIVER
                </button>
              </div>

              {formData.fulfilment === 'collect' ? (
                <div className="mt-4 border border-line bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center border border-line-strong font-mono text-[10px]">⌂</span>
                    <div>
                      <p className="text-xs font-medium text-ink">{activeBranch.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{activeBranch.city}</p>
                      <p className="mt-0.5 text-xs text-muted">Manager: {activeBranch.manager}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 border border-line bg-surface p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="eyebrow block">STREET ADDRESS</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => handleFieldChange('deliveryAddress', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3.5 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block">CITY</label>
                    <input
                      type="text"
                      value={formData.deliveryCity}
                      onChange={(e) => handleFieldChange('deliveryCity', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3.5 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block">POSTAL CODE</label>
                    <input
                      type="text"
                      value={formData.deliveryPostalCode}
                      onChange={(e) => handleFieldChange('deliveryPostalCode', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3.5 text-sm text-ink"
                    />
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <h2 className="display-sub text-ink">Payment</h2>
                <span className="eyebrow">03 / 04</span>
              </div>
              <div className="mt-5 grid grid-cols-3 border border-line bg-surface">
                {(['card', 'apple_pay', 'bancontact'] as const).map((method, idx) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleFieldChange('paymentMethod', method)}
                    className={`h-10 font-mono text-[10px] uppercase ${idx > 0 ? 'border-l border-line' : ''} ${formData.paymentMethod === method ? 'bg-inverse text-inverse-ink' : 'text-muted'}`}
                  >
                    {method.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {formData.paymentMethod === 'card' && (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="eyebrow block">CARD NUMBER</label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleFieldChange('cardNumber', formatCardNumber(e.target.value))}
                      className="tabular mt-2 h-11 w-full border border-line bg-surface px-3.5 text-sm text-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="eyebrow block">EXPIRY</label>
                      <input
                        type="text"
                        value={formData.expiry}
                        onChange={(e) => handleFieldChange('expiry', formatExpiry(e.target.value))}
                        className="tabular mt-2 h-11 w-full border border-line bg-surface px-3.5 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="eyebrow block">CVC</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.cvc}
                        onChange={(e) => handleFieldChange('cvc', e.target.value.replace(/\D/g, ''))}
                        className="tabular mt-2 h-11 w-full border border-line bg-surface px-3.5 text-sm text-ink"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow block">NAME ON CARD</label>
                    <input
                      type="text"
                      value={formData.nameOnCard}
                      onChange={(e) => handleFieldChange('nameOnCard', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-surface px-3.5 text-sm text-ink"
                    />
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <h2 className="display-sub text-ink">Review</h2>
                <span className="eyebrow">04 / 04</span>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(e) => handleFieldChange('acceptedTerms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#d4ff00]"
                />
                <span className="text-xs text-ink-soft">
                  I understand this is a demonstration checkout and no real order will be placed.
                </span>
              </label>

              <button
                type="submit"
                className="tabular mt-6 flex h-12 w-full items-center justify-center gap-2 bg-accent font-mono text-[10px] font-medium tracking-[0.2em] text-accent-ink uppercase transition hover:bg-accent-strong"
              >
                <span>PLACE DEMO ORDER · €{total.toFixed(2)}</span>
                <span>→</span>
              </button>
            </section>
          </form>

          <div className="lg:sticky lg:top-8 lg:col-span-4">
            <OrderSummaryCard
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
              fulfilment={formData.fulfilment}
              branch={activeBranch}
              mode="checkout"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;