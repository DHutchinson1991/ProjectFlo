import { Module } from '@nestjs/common';
import { CrewPaymentTemplatesModule } from './crew-payment-templates/crew-payment-templates.module';
import { PaymentBracketsModule } from './payment-brackets/payment-brackets.module';
import { QuotesModule } from './quotes/quotes.module';
import { PaymentSchedulesModule } from './payment-schedules/payment-schedules.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EstimatesModule } from './estimates/estimates.module';
import { ContractsModule } from './contracts/contracts.module';
import { BrandFinanceSettingsModule } from './brand-finance-settings/brand-finance-settings.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    CrewPaymentTemplatesModule,
    PaymentBracketsModule,
    QuotesModule,
    PaymentSchedulesModule,
    InvoicesModule,
    EstimatesModule,
    ContractsModule,
    BrandFinanceSettingsModule,
    PaymentMethodsModule,
    StripeModule,
  ],
  exports: [
    CrewPaymentTemplatesModule,
    PaymentBracketsModule,
    QuotesModule,
    PaymentSchedulesModule,
    InvoicesModule,
    EstimatesModule,
    ContractsModule,
    BrandFinanceSettingsModule,
    PaymentMethodsModule,
    StripeModule,
  ],
})
export class FinanceModule {}
