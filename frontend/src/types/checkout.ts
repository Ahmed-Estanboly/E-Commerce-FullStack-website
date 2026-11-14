import { CartItem } from "../store/cart-context";

export type FulfilmentMethod = 'collect' | 'deliver';
export type PaymentMethod = 'card' | 'apple_pay' | 'bancontact';
export type CheckoutStep = 'details' | 'confirmation';

export interface Branch {
    id: number;
    slug: string;
    name: string;
    city: string;
    manager: string;
  }

export interface CheckoutFormData {
  email: string;
  phone: string;
  fulfilment: FulfilmentMethod;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  paymentMethod: PaymentMethod;
  cardNumber: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
  acceptedTerms: boolean;
}

export interface FormErrors {
  email?: string;
  phone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  nameOnCard?: string;
  acceptedTerms?: string;
}

export interface ConfirmedOrder {
  orderNumber: string;
  customerFirstName: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  fulfilment: FulfilmentMethod;
  branch: Branch;
  deliveryAddress?: string;
  paymentMethod: PaymentMethod;
  cardLast4: string;
  createdAt: string;
}