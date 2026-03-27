export interface VariableCategory {
  category: string;
  variables: Array<{ key: string; label: string; example: string }>;
}

export const AVAILABLE_VARIABLES: VariableCategory[] = [
  {
    category: 'Client',
    variables: [
      { key: 'client.full_name', label: 'Full Name', example: 'Sarah & James Johnson' },
      { key: 'client.first_name', label: 'First Name', example: 'Sarah' },
      { key: 'client.last_name', label: 'Last Name', example: 'Johnson' },
      { key: 'client.email', label: 'Email', example: 'sarah@example.com' },
      { key: 'client.phone', label: 'Phone', example: '+44 7700 900000' },
      { key: 'client.company', label: 'Company', example: 'Johnson Ltd' },
    ],
  },
  {
    category: 'Event',
    variables: [
      { key: 'event.date', label: 'Event Date (long)', example: 'Saturday, 14 June 2025' },
      { key: 'event.date_short', label: 'Event Date (short)', example: '14/06/2025' },
      { key: 'event.venue', label: 'Venue Name', example: 'Hedsor House' },
      { key: 'event.venue_address', label: 'Venue Address', example: 'Taplow, Maidenhead SL6 0HX' },
      { key: 'event.days', label: 'Event Days Summary', example: 'Wedding Day (10:00 – 23:00)' },
      { key: 'event.day_count', label: 'Number of Days', example: '1' },
      { key: 'event.locations', label: 'All Locations', example: "Hedsor House, St Mary's Church" },
      { key: 'event.subjects', label: 'Key People', example: 'Sarah, James, Emily (MOH)' },
      { key: 'event.type', label: 'Event Type', example: 'Wedding' },
    ],
  },
  {
    category: 'Package',
    variables: [
      { key: 'package.name', label: 'Package Name', example: 'Gold Wedding Package' },
      { key: 'package.price', label: 'Package Price', example: '£3,500.00' },
      { key: 'package.currency', label: 'Currency', example: 'GBP' },
    ],
  },
  {
    category: 'Films',
    variables: [
      { key: 'films.list', label: 'Film Names', example: 'Feature Film, Highlights' },
      { key: 'films.count', label: 'Number of Films', example: '2' },
    ],
  },
  {
    category: 'Crew',
    variables: [
      { key: 'crew.list', label: 'Crew Members', example: 'Lead Videographer: Dan H\nSecond Shooter: Alex T' },
      { key: 'crew.count', label: 'Crew Count', example: '3' },
    ],
  },
  {
    category: 'Financial',
    variables: [
      { key: 'estimate.total', label: 'Total Amount', example: '£3,500.00' },
      { key: 'estimate.deposit', label: 'Deposit Amount', example: '£875.00' },
      { key: 'estimate.tax_rate', label: 'Tax Rate', example: '20%' },
      { key: 'estimate.payment_schedule', label: 'Payment Schedule', example: 'Booking Deposit: £875.00 due 01/03/2025' },
      { key: 'estimate.number', label: 'Estimate Number', example: 'EST-2025-001' },
    ],
  },
  {
    category: 'Payment Schedule',
    variables: [
      { key: 'payment.schedule_name', label: 'Schedule Name', example: '50/50 Split' },
      { key: 'payment.schedule_summary', label: 'Schedule Breakdown', example: 'Booking Deposit: 50% (£1,750) on booking; Final Balance: 50% (£1,750) 14 days before the event' },
      { key: 'payment.deposit_amount', label: 'Deposit Amount', example: '50%' },
      { key: 'payment.final_balance_timing', label: 'Final Balance Due', example: '14 days before the event' },
      { key: 'payment.instalment_count', label: 'Number of Payments', example: '2' },
    ],
  },
  {
    category: 'Brand',
    variables: [
      { key: 'brand.name', label: 'Brand/Company Name', example: 'Moonrise Films' },
      { key: 'brand.email', label: 'Email', example: 'info@moonrisefilms.co.uk' },
      { key: 'brand.phone', label: 'Phone', example: '+44 7700 900000' },
      { key: 'brand.website', label: 'Website', example: 'www.moonrisefilms.co.uk' },
      { key: 'brand.address', label: 'Full Address', example: '10 High Street, London, SW1A 1AA' },
      { key: 'brand.currency', label: 'Currency', example: 'GBP' },
      { key: 'brand.tax_number', label: 'VAT/Tax Number', example: 'GB123456789' },
      { key: 'brand.tax_rate', label: 'Default Tax Rate', example: '20%' },
      { key: 'brand.payment_method', label: 'Payment Method', example: 'Bank Transfer' },
      { key: 'brand.payment_terms', label: 'Payment Terms', example: '30 days' },
      { key: 'brand.bank_name', label: 'Bank Name', example: 'Barclays' },
      { key: 'brand.bank_account_name', label: 'Account Name', example: 'Moonrise Films Ltd' },
      { key: 'brand.bank_sort_code', label: 'Sort Code', example: '20-30-40' },
      { key: 'brand.bank_account_number', label: 'Account Number', example: '12345678' },
      { key: 'brand.late_fee_percent', label: 'Late Fee %', example: '2%' },
      { key: 'brand.cancellation_tier1_days', label: 'Cancellation Tier 1 Days', example: '90' },
      { key: 'brand.cancellation_tier2_days', label: 'Cancellation Tier 2 Days', example: '30' },
      { key: 'brand.cancellation_tier1_percent', label: 'Cancellation Fee %', example: '50%' },
    ],
  },
  {
    category: 'Dates',
    variables: [
      { key: 'today.date', label: "Today's Date (long)", example: 'Monday, 3 February 2025' },
      { key: 'today.date_short', label: "Today's Date (short)", example: '03/02/2025' },
    ],
  },
];
