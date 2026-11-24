import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CheckoutFormData, CheckoutStep, ConfirmedOrder, FormErrors } from '../types/checkout';
import { OrderSummaryCard } from '../components/checkout/OrderSummaryCard';
import { couponsService } from '../lib/api/coupons.service';
import { OrderConfirmationView } from '../components/checkout/OrderConfirmationView';
import { useCart } from '../store/cart-context';
import { useBranchSelection } from '../store/branch-context'
import { getOrderRequestError, ordersService } from '../lib/api/orders.service';
import { getStoredSession } from '../lib/auth';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, subtotal, clearCart } = useCart();
  const {
    branches,
    isLoadingBranches,
    branchError,
  } = useBranchSelection();
  const activeBranches = useMemo(() => branches.filter((branch) => branch.isActive), [branches]);
  const cartBranches = useMemo(() => {
    const branchIds = new Set(items.map((item) => item.branchId))
    return activeBranches.filter((branch) => branchIds.has(branch._id))
  }, [activeBranches, items])

  const [step, setStep] = useState<CheckoutStep>('details');
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const session = getStoredSession()?.user
    return {
    email: session?.email ?? '',
    phone: session?.phone ?? '',
    fulfilment: 'collect',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: session?.name ?? '',
    acceptedTerms: false,
    }
  });

  const activeBranch = cartBranches[0] ?? activeBranches[0] ?? null;

  const shippingFee = formData.fulfilment === 'deliver' ? 6.5 : 0;
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

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

    if (!items.length) {
      nextErrors.branch = 'Your cart is empty.';
    } else {
      const inactiveBranchItem = items.find((item) =>
        !activeBranches.some((branch) => branch._id === item.branchId),
      )
      if (inactiveBranchItem) {
        nextErrors.branch = `${inactiveBranchItem.branchName} is no longer active. Remove its items before checkout.`
      }
    }

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
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }
    if (!items.length || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const session = getStoredSession();
      const customerName =
        session?.user.name?.trim() ||
        formData.nameOnCard.trim() ||
        formData.email.trim();
      const digits = formData.cardNumber.replace(/\s/g, '');
      const deliveryAddress =
        formData.fulfilment === 'deliver'
          ? `${formData.deliveryAddress}, ${formData.deliveryPostalCode} ${formData.deliveryCity}`
          : undefined;

      const created = await ordersService.createOrder({
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        customerName,
        items: items.map((item) => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          branchId: item.branchId,
          branchName: item.branchName,
        })),
        subtotal,
        shippingFee,
        fulfilment: formData.fulfilment,
        branch: cartBranches[0] ? { branchId: cartBranches[0]._id } : undefined,
        branches: cartBranches.map((branch) => ({ branchId: branch._id })),
        deliveryAddress,
        paymentMethod: formData.paymentMethod,
        cardLast4: digits.slice(-4) || undefined,
        couponCode: coupon?.code,
      });

      const order: ConfirmedOrder = {
        orderNumber: created.orderNumber,
        customerFirstName:
          customerName.split(/\s+/)[0] ||
          formData.email.split('@')[0] ||
          'Guest',
        items: [...items],
        subtotal: created.subtotal,
        shippingFee: created.shippingFee,
        total: created.total,
        fulfilment: created.fulfilment,
        branch: activeBranch,
        branches: cartBranches,
        deliveryAddress,
        paymentMethod: formData.paymentMethod,
        cardLast4: digits.slice(-4) || '4242',
        createdAt: new Date(created.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setConfirmedOrder(order);
      setStep('confirmation');
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setSubmitError(
        getOrderRequestError(requestError, 'Unable to place your order. Please try again.'),
      );
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="page-enter pb-16 sm:pb-20">
      <div className="border-b border-line pt-6 pb-5 sm:pt-8 sm:pb-7">
        <div className="container-nova">
          <nav aria-label="Breadcrumb" className="eyebrow">
            HOME <span className="mx-1.5">/</span> BAG <span className="mx-1.5">/</span>{' '}
            <span className="text-ink">CHECKOUT</span>
          </nav>

          <p className="eyebrow mt-4 sm:mt-5">— STEP 02 OF 03</p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h1 className="display-title text-ink">
              Checkout<span className="text-accent">.</span>
            </h1>

            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Orders are recorded by the Nova backend. No payment is taken and no card is stored.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-line py-3 sm:py-4">
        <div className="container-nova flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
            <span className="border border-line-strong bg-surface px-2.5 py-1 font-mono text-[10px] uppercase text-ink">
              {isLoadingBranches
                ? 'Loading…'
                : cartBranches.length
                  ? `${cartBranches.length} ${cartBranches.length === 1 ? 'store' : 'stores'}`
                  : 'No store selected'}
            </span>
            {!cartBranches.length && !isLoadingBranches ? (
              <span className="text-[10px] text-muted">Pick a store from the header first.</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container-nova pt-6 sm:pt-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <form onSubmit={handleSubmit} noValidate className="space-y-10 lg:col-span-8">
            {branchError ? (
              <div role="alert" className="border border-danger bg-danger-soft px-4 py-3 text-xs text-danger">
                Could not load store branches: {branchError}
              </div>
            ) : null}
            {errors.branch ? <p role="alert" className="text-xs text-danger">{errors.branch}</p> : null}
            <div className="flex flex-wrap items-center gap-3 border border-line bg-accent-soft/50 px-4 py-3">
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-medium text-accent-ink uppercase">DEMO</span>
              <p className="eyebrow text-[9px] text-ink-soft">
                NO PAYMENT IS CHARGED. USE ANY WELL-FORMED CARD DETAILS. THE ORDER IS RECORDED BY THE BACKEND.
              </p>
            </div>

            {hasErrors && (
              <div role="alert" className="flex items-start gap-3 border border-danger bg-danger-soft px-4 py-3 text-xs text-danger">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-danger font-mono text-[10px] font-bold">!</span>
                <p><strong>Check the highlighted fields.</strong> Please fix the errors below before placing the demo order.</p>
              </div>
            )}

            {submitError ? (
              <div role="alert" className="flex items-start gap-3 border border-danger bg-danger-soft px-4 py-3 text-xs text-danger">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-danger font-mono text-[10px] font-bold">!</span>
                <p><strong>Order not placed.</strong> {submitError}</p>
              </div>
            ) : null}

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
                  DELIVER · €6.50
                </button>
              </div>

              {formData.fulfilment === 'collect' ? (
                <div className="mt-4 border border-line bg-surface p-4">
                  {cartBranches.map((branch) => (
                    <div key={branch._id} className="flex items-start gap-3 border-b border-line py-3 last:border-0 last:pb-0 first:pt-0">
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center border border-line-strong font-mono text-[10px]">⌂</span>
                      <div>
                        <p className="text-xs font-medium text-ink">{branch.name}</p>
                        <p className="mt-0.5 text-xs text-muted">{branch.address}</p>
                        <p className="mt-0.5 text-xs text-muted">{branch.phone} · {branch.workingHours}</p>
                      </div>
                    </div>
                  ))}
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
                    {errors.deliveryAddress && <p className="mt-1.5 text-xs text-danger">{errors.deliveryAddress}</p>}
                  </div>
                  <div>
                    <label className="eyebrow block">CITY</label>
                    <input
                      type="text"
                      value={formData.deliveryCity}
                      onChange={(e) => handleFieldChange('deliveryCity', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3.5 text-sm text-ink"
                    />
                    {errors.deliveryCity && <p className="mt-1.5 text-xs text-danger">{errors.deliveryCity}</p>}
                  </div>
                  <div>
                    <label className="eyebrow block">POSTAL CODE</label>
                    <input
                      type="text"
                      value={formData.deliveryPostalCode}
                      onChange={(e) => handleFieldChange('deliveryPostalCode', e.target.value)}
                      className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3.5 text-sm text-ink"
                    />
                    {errors.deliveryPostalCode && <p className="mt-1.5 text-xs text-danger">{errors.deliveryPostalCode}</p>}
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
                      className={`tabular mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink ${errors.cardNumber ? 'border-danger' : 'border-line'}`}
                    />
                    {errors.cardNumber && <p className="mt-1.5 text-xs text-danger">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="eyebrow block">EXPIRY</label>
                      <input
                        type="text"
                        value={formData.expiry}
                        onChange={(e) => handleFieldChange('expiry', formatExpiry(e.target.value))}
                        className={`tabular mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink ${errors.expiry ? 'border-danger' : 'border-line'}`}
                      />
                      {errors.expiry && <p className="mt-1.5 text-xs text-danger">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="eyebrow block">CVC</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.cvc}
                        onChange={(e) => handleFieldChange('cvc', e.target.value.replace(/\D/g, ''))}
                        className={`tabular mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink ${errors.cvc ? 'border-danger' : 'border-line'}`}
                      />
                      {errors.cvc && <p className="mt-1.5 text-xs text-danger">{errors.cvc}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow block">NAME ON CARD</label>
                    <input
                      type="text"
                      value={formData.nameOnCard}
                      onChange={(e) => handleFieldChange('nameOnCard', e.target.value)}
                      className={`mt-2 h-11 w-full border bg-surface px-3.5 text-sm text-ink ${errors.nameOnCard ? 'border-danger' : 'border-line'}`}
                    />
                    {errors.nameOnCard && <p className="mt-1.5 text-xs text-danger">{errors.nameOnCard}</p>}
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
                  className="mt-0.5 h-4 w-4 accent-accent"
                />
                <span className="text-xs text-ink-soft">
                  I understand this order is recorded by the store backend and no real payment will be taken.
                </span>
              </label>
              {errors.acceptedTerms && <p className="mt-1.5 text-xs text-danger">{errors.acceptedTerms}</p>}

              <div className="mt-6 border border-line p-4">
                <label htmlFor="coupon-code" className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Coupon code</label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(null) }}
                    placeholder="e.g. WELCOME10"
                    className="h-10 flex-1 border border-line bg-canvas/40 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink outline-none focus:border-line-strong"
                    disabled={couponBusy}
                  />
                  {coupon ? (
                    <button
                      type="button"
                      onClick={() => { setCoupon(null); setCouponInput(''); setCouponError(null) }}
                      className="h-10 border border-line px-4 font-mono text-[9px] uppercase tracking-widest text-muted transition-colors hover:border-danger hover:text-danger"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={couponBusy || !couponInput.trim()}
                      onClick={async () => {
                        setCouponBusy(true)
                        setCouponError(null)
                        try {
                          const result = await couponsService.validate(couponInput.trim(), subtotal)
                          setCoupon({ code: result.code, discount: result.discount })
                          setCouponInput('')
                        } catch (err) {
                          setCouponError(err instanceof Error ? err.message : 'Invalid coupon')
                        } finally {
                          setCouponBusy(false)
                        }
                      }}
                      className="h-10 border border-ink px-4 font-mono text-[9px] uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-40"
                    >
                      {couponBusy ? 'Checking…' : 'Apply'}
                    </button>
                  )}
                </div>
                {coupon ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                    {coupon.code} applied — you save €{coupon.discount.toFixed(2)}
                  </p>
                ) : null}
                {couponError ? <p className="mt-2 text-xs text-danger">{couponError}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingBranches || !cartBranches.length}
                className="tabular mt-6 flex h-12 w-full items-center justify-center gap-2 bg-accent font-mono text-[10px] font-medium tracking-[0.2em] text-accent-ink uppercase transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {isSubmitting
                    ? 'PLACING ORDER…'
                    : `PLACE ORDER · €${total.toFixed(2)}`}
                </span>
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
              branch={activeBranch ?? undefined}
              mode="checkout"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
