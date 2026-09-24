/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: Mock / Future Billing Gateway Interface
 *
 * Implements an isolated billing boundary for invoicing, payment verification,
 * and refunds without external payment processing dependencies.
 */

import { deterministicHash } from '../../state/determinism';
import {
  BillingInvoice,
  PaymentVerificationResult,
  IBillingGateway,
} from './types';

export class MockBillingGateway implements IBillingGateway {
  private invoices: Map<string, BillingInvoice> = new Map();

  public async createInvoice(
    cubId: string,
    amountUsd: number,
    description: string
  ): Promise<BillingInvoice> {
    const now = Date.now();
    const invoiceId = `INV_${deterministicHash(`${cubId}:${amountUsd}:${now}`).slice(2, 18)}`;

    const invoice: BillingInvoice = Object.freeze({
      invoiceId,
      cubId,
      amountUsd,
      currency: 'USD',
      description,
      status: 'PENDING',
      createdAt: now,
    });

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }

  public async verifyPayment(
    invoiceId: string,
    paymentToken?: string
  ): Promise<PaymentVerificationResult> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, invoiceId, error: `Invoice '${invoiceId}' not found.` };
    }

    if (invoice.status === 'PAID') {
      return { success: true, invoiceId, transactionReference: `TX_${invoiceId}` };
    }

    // Accept mock payment tokens or automatically approve pending invoice
    const now = Date.now();
    const paidInvoice: BillingInvoice = Object.freeze({
      ...invoice,
      status: 'PAID',
      paidAt: now,
    });
    this.invoices.set(invoiceId, paidInvoice);

    return {
      success: true,
      invoiceId,
      transactionReference: `TX_${deterministicHash(`${invoiceId}:${now}:${paymentToken || 'DIRECT'}`).slice(2, 18)}`,
    };
  }

  public async processRefund(invoiceId: string, reason: string): Promise<boolean> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status !== 'PAID') return false;

    const refunded: BillingInvoice = Object.freeze({
      ...invoice,
      status: 'REFUNDED',
    });
    this.invoices.set(invoiceId, refunded);
    return true;
  }

  public async getInvoice(invoiceId: string): Promise<BillingInvoice | undefined> {
    return this.invoices.get(invoiceId);
  }
}
