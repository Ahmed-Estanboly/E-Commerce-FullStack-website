import type { ConfirmedOrder } from '../../types/checkout';
import { OrderSummaryCard } from './OrderSummaryCard';

interface OrderConfirmationViewProps {
  order: ConfirmedOrder;
  onContinueShopping: () => void;
  onReturnHome: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onContinueShopping,
  onReturnHome,
}) => {
  return (
    <div className="page-enter pb-20">
      {/* ترويسة تأكيد الطلب */}
      <div className="border-b border-line pt-8 pb-7">
        <div className="container-nova">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
            — ORDER CONFIRMED · {order.orderNumber}
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h1 className="display-title text-ink">
              Thank you, <span className="text-[#9ec200] capitalize dark:text-accent">
                            {order.customerFirstName}.
                        </span>
              <span className="text-[#9ec200] dark:text-accent">.</span>
            </h1>

            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Your demonstration order was recorded at {order.createdAt}. No payment was processed.
            </p>
          </div>
        </div>
      </div>

      {/* شريط الخطوات المكتملة */}
      <div className="border-b border-line py-4">
        <div className="container-nova flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 opacity-60">
            <span className="border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted">01</span>
            <span className="eyebrow">BAG</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted">02</span>
            <span className="eyebrow">DETAILS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-medium text-accent-ink">03</span>
            <span className="eyebrow-strong">CONFIRMATION</span>
          </div>
        </div>
      </div>

      {/* تفاصيل الطلب والملخص */}
      <div className="container-nova pt-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="space-y-8 lg:col-span-8">
            <div className="border border-line bg-surface p-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="display-sub text-ink">Fulfilment Details</h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                  {order.fulfilment === 'collect' ? 'IN-STORE COLLECTION' : 'HOME DELIVERY'}
                </span>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                {order.fulfilment === 'collect' ? (
                  <>
                    <div>
                      <p className="eyebrow text-muted">SELECTED BRANCH</p>
                      <p className="mt-1 font-medium text-ink">{order.branch.name}</p>
                      <p className="mt-0.5 text-muted">{order.branch.city}</p>
                    </div>
                    <div>
                      <p className="eyebrow text-muted">BRANCH MANAGER</p>
                      <p className="mt-1 text-ink">{order.branch.manager}</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="eyebrow text-muted">DELIVERY ADDRESS</p>
                    <p className="mt-1 font-medium text-ink">{order.deliveryAddress}</p>
                    <p className="mt-0.5 text-muted">Dispatched from {order.branch.name}</p>
                  </div>
                )}

                <div className="border-t border-line pt-4">
                  <p className="eyebrow text-muted">PAYMENT METHOD</p>
                  <p className="mt-1 uppercase text-ink">
                    {order.paymentMethod === 'card'
                      ? `Credit Card ending in •••• ${order.cardLast4}`
                      : order.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* أزرار العودة للتسوق */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onContinueShopping}
                className="bg-accent px-6 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent-ink transition hover:bg-accent-strong"
              >
                CONTINUE SHOPPING →
              </button>
              <button
                type="button"
                onClick={onReturnHome}
                className="border border-line-strong bg-surface px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-ink"
              >
                RETURN HOME
              </button>
            </div>
          </div>

          {/* بطاقة ملخص الطلب */}
          <div className="lg:col-span-4">
            <OrderSummaryCard
              items={order.items}
              subtotal={order.subtotal}
              shippingFee={order.shippingFee}
              total={order.total}
              fulfilment={order.fulfilment}
              branch={order.branch}
              mode="confirmation"
              orderNumber={order.orderNumber}
              cardLast4={order.cardLast4}
              paymentMethod={order.paymentMethod}
            />
          </div>
        </div>
      </div>
    </div>
  );
};