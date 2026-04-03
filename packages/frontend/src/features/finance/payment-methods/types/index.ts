export type PaymentMethodType = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'STRIPE';

export interface BankTransferConfig {
  bank_name?: string;
  account_name?: string;
  sort_code?: string;
  account_number?: string;
  iban?: string;
  swift?: string;
}

export interface StripeConfig {
  /** Legacy: manual Stripe Payment Link URL (used when no Connect account) */
  payment_link_url?: string;
}

export type PaymentMethodConfig = BankTransferConfig | StripeConfig | Record<string, unknown>;

export interface PaymentMethod {
  id: number;
  brand_id: number;
  type: PaymentMethodType;
  label: string;
  is_default: boolean;
  is_active: boolean;
  instructions: string | null;
  config: PaymentMethodConfig | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodData {
  type: PaymentMethodType;
  label: string;
  is_default?: boolean;
  is_active?: boolean;
  instructions?: string;
  config?: PaymentMethodConfig;
  order_index?: number;
}

export interface UpdatePaymentMethodData extends Partial<CreatePaymentMethodData> {}
