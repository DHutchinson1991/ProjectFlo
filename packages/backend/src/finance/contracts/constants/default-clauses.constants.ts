export interface DefaultClause {
  title: string;
  body: string;
  clause_type: string;
  order_index: number;
}

export interface DefaultCategory {
  name: string;
  description: string;
  order_index: number;
  clauses: DefaultClause[];
}

export function getDefaultClauses(countryCode: string): DefaultCategory[] {
  const common: DefaultCategory[] = [
    {
      name: 'Payment Terms',
      description: 'Clauses related to deposits, payment schedules, and refund policies.',
      order_index: 0,
      clauses: [
        {
          title: 'Booking Deposit',
          body: 'A non-refundable booking deposit of {{payment.deposit_amount}} is required to secure the date. Payment is due upon signing this agreement via {{brand.payment_method}}. The remaining balance is due no later than {{payment.final_balance_timing}} ({{event.date_short}}).\n\nPayment Schedule: {{payment.schedule_summary}}\n\nPayment Details:\n{{brand.bank_name}}\nAccount Name: {{brand.bank_account_name}}\nSort Code: {{brand.bank_sort_code}}\nAccount Number: {{brand.bank_account_number}}',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Late Payment',
          body: 'Invoices not paid within {{brand.payment_terms}} of the due date will incur a late payment fee of {{brand.late_fee_percent}} per month on the outstanding balance.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
        {
          title: 'Instalment Plan',
          body: 'The total fee of {{estimate.total}} may be paid in {{payment.instalment_count}} instalments as outlined in the payment schedule, with the final payment due no later than {{payment.final_balance_timing}}. A payment schedule will be provided upon booking.',
          clause_type: 'EXTRA',
          order_index: 2,
        },
      ],
    },
    {
      name: 'Cancellation & Rescheduling',
      description: 'Terms for cancellation notices and rescheduling fees.',
      order_index: 1,
      clauses: [
        {
          title: 'Cancellation by Client',
          body: 'If {{client.full_name}} cancels more than {{brand.cancellation_tier1_days}} days before the event ({{event.date}}), the booking deposit is forfeited. Cancellations within {{brand.cancellation_tier1_days}} days of the event will incur a charge of {{brand.cancellation_tier1_percent}} of the total fee ({{estimate.total}}). Cancellations within {{brand.cancellation_tier2_days}} days will incur the full fee.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Cancellation by Provider',
          body: 'In the unlikely event that {{brand.name}} must cancel, all payments received will be refunded in full. {{brand.name}} will make reasonable efforts to recommend a suitable replacement.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
        {
          title: 'Rescheduling',
          body: 'One date change is permitted without charge if requested at least 60 days before the original event date, subject to availability. Additional changes may incur an administrative fee.',
          clause_type: 'EXTRA',
          order_index: 2,
        },
      ],
    },
    {
      name: 'Scope of Work',
      description: 'Defines what is included in the agreed service.',
      order_index: 2,
      clauses: [
        {
          title: 'Services Provided',
          body: '{{brand.name}} will deliver the services as outlined in the accompanying proposal ({{estimate.number}}) and package description ({{package.name}}). Any additional services requested after signing must be agreed in writing and may incur additional charges.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Timeline & Deliverables',
          body: '{{brand.name}} will deliver the final product(s) within the timeframe specified in the proposal. {{client.full_name}} acknowledges that timelines are estimates and may vary depending on project complexity.\n\nEvent Date: {{event.date}}\nVenue: {{event.venue}}\nFilms: {{films.list}}',
          clause_type: 'STANDARD',
          order_index: 1,
        },
      ],
    },
    {
      name: 'Liability & Insurance',
      description: 'Limitations of liability and insurance provisions.',
      order_index: 3,
      clauses: [
        {
          title: 'Limitation of Liability',
          body: "{{brand.name}}'s total liability under this agreement shall not exceed the total fee paid by {{client.full_name}} ({{estimate.total}}). {{brand.name}} shall not be liable for any indirect, incidental, or consequential damages.",
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Professional Indemnity',
          body: '{{brand.name}} maintains professional indemnity insurance and public liability insurance adequate for the scope of work. Copies of insurance certificates are available upon request.',
          clause_type: 'EXTRA',
          order_index: 1,
        },
      ],
    },
    {
      name: 'Intellectual Property',
      description: 'Ownership and usage rights for creative work.',
      order_index: 4,
      clauses: [
        {
          title: 'Copyright & Ownership',
          body: 'All creative work produced under this agreement remains the intellectual property of {{brand.name}}. {{client.full_name}} is granted a non-exclusive, perpetual licence to use the deliverables for personal, non-commercial purposes unless otherwise agreed.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Portfolio & Marketing Use',
          body: '{{brand.name}} reserves the right to use images, footage, or work samples from this project for portfolio, marketing, and social media purposes unless {{client.full_name}} opts out in writing.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
        {
          title: 'Commercial Licence',
          body: 'A commercial use licence may be purchased separately, granting the Client rights to use deliverables in advertising, resale, or other commercial activities.',
          clause_type: 'EXTRA',
          order_index: 2,
        },
      ],
    },
    {
      name: 'Force Majeure',
      description: 'Provisions for events outside reasonable control.',
      order_index: 5,
      clauses: [
        {
          title: 'Force Majeure',
          body: 'Neither party shall be held liable for failure to perform obligations under this agreement due to circumstances beyond their reasonable control, including but not limited to natural disasters, pandemics, government restrictions, or severe weather. Both parties agree to negotiate in good faith to reschedule or adjust the services.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
      ],
    },
    {
      name: 'Confidentiality',
      description: 'Data protection and privacy obligations.',
      order_index: 6,
      clauses: [
        {
          title: 'Confidentiality',
          body: 'Both parties agree to keep confidential any personal or business information shared during the course of this agreement. This obligation survives termination of this agreement.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
      ],
    },
    {
      name: 'General Provisions',
      description: 'Dispute resolution, governing law, and other standard terms.',
      order_index: 7,
      clauses: [
        {
          title: 'Entire Agreement',
          body: 'This contract, together with estimate {{estimate.number}} and the {{package.name}} package description, constitutes the entire agreement between {{client.full_name}} and {{brand.name}} and supersedes all prior negotiations, representations, or agreements.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Amendments',
          body: 'Any amendments to this agreement must be made in writing and signed by both parties.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
      ],
    },
  ];

  const releaseCategories: DefaultCategory[] = [
    {
      name: 'Talent Release Form',
      description:
        'Permission from individuals (actors, models, participants) to use their image, voice, and likeness in video productions.',
      order_index: common.length,
      clauses: [
        {
          title: 'Grant of Rights',
          body: 'I, the undersigned ("Talent"), hereby grant {{brand.name}} and its assigns the irrevocable right and permission to use my name, likeness, image, voice, appearance, and performance (collectively "Likeness") in connection with the production titled "{{event.type}}" filmed on or around {{event.date}}. This grant includes the right to photograph, record, edit, modify, and reproduce my Likeness in any media now known or hereafter devised, throughout the world, in perpetuity.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Compensation & Consideration',
          body: 'Talent acknowledges that participation in this production is provided voluntarily or for the agreed compensation of {{estimate.total}}. Talent agrees that this consideration is adequate and sufficient for the rights granted herein.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
        {
          title: 'No Obligation to Use',
          body: "{{brand.name}} is under no obligation to use the Talent's Likeness or to produce, distribute, or otherwise exploit any production in which the Talent appears. No further compensation shall be due regardless of use or non-use.",
          clause_type: 'STANDARD',
          order_index: 2,
        },
        {
          title: 'Duration & Territory',
          body: 'This release is effective worldwide and shall remain in effect in perpetuity from the date of signing. The rights granted may be exercised in all media and formats, including but not limited to film, television, internet, social media, print, and any digital or physical medium.',
          clause_type: 'STANDARD',
          order_index: 3,
        },
        {
          title: 'Release & Waiver of Claims',
          body: "Talent hereby releases, discharges, and holds harmless {{brand.name}}, its officers, employees, agents, and assigns from any and all claims, demands, or causes of action arising out of or in connection with the use of the Talent's Likeness, including but not limited to claims for defamation, invasion of privacy, right of publicity, or infringement of moral rights.",
          clause_type: 'STANDARD',
          order_index: 4,
        },
        {
          title: 'Acknowledgement & Consent',
          body: 'Talent confirms they are of legal age and have read this release in its entirety. Talent understands the contents and freely consents to the terms stated herein. If Talent is under 18, a parent or legal guardian must also sign this release.',
          clause_type: 'STANDARD',
          order_index: 5,
        },
        {
          title: 'Wardrobe & Appearance',
          body: 'Talent agrees to appear as directed by the production team and acknowledges that their appearance may be altered, enhanced, or modified through editing, digital effects, or other post-production techniques.',
          clause_type: 'EXTRA',
          order_index: 6,
        },
      ],
    },
    {
      name: 'Location Release Agreement',
      description:
        'Permission from property owners to film at their locations, covering access rights, liability, and property usage.',
      order_index: common.length + 1,
      clauses: [
        {
          title: 'Property Access & Permission',
          body: 'The undersigned property owner/authorised representative ("Owner") hereby grants {{brand.name}} permission to enter and use the property located at {{event.venue}} (the "Property") for the purpose of filming, photographing, and recording in connection with a production on or around {{event.date}}.',
          clause_type: 'STANDARD',
          order_index: 0,
        },
        {
          title: 'Filming Dates & Times',
          body: 'Access to the Property is granted for the dates and times specified in the production schedule: {{event.days}}. Any additional time required must be agreed upon in writing between the parties. {{brand.name}} shall arrive for setup no earlier than the agreed start time and vacate the premises within 1 hour after the scheduled end time.',
          clause_type: 'STANDARD',
          order_index: 1,
        },
        {
          title: 'Location Fee',
          body: 'In consideration for the use of the Property, {{brand.name}} agrees to pay the Owner a location fee as separately agreed, or the Owner waives any fee and grants this permission at no cost. Payment, if applicable, shall be made on or before the first day of filming.',
          clause_type: 'STANDARD',
          order_index: 2,
        },
        {
          title: 'Property Damage & Insurance',
          body: '{{brand.name}} shall exercise reasonable care while on the Property and shall be responsible for repairing or compensating the Owner for any damage to the Property caused directly by the production crew or equipment during the filming period. {{brand.name}} maintains public liability insurance adequate to cover any such damage.',
          clause_type: 'STANDARD',
          order_index: 3,
        },
        {
          title: 'Usage Rights',
          body: 'Owner grants {{brand.name}} the right to use all footage, photographs, and recordings made at the Property in any and all media now known or hereafter devised, throughout the world, in perpetuity. Owner waives any right to inspect or approve the manner in which the Property is depicted in the final production.',
          clause_type: 'STANDARD',
          order_index: 4,
        },
        {
          title: 'Hold Harmless & Indemnification',
          body: 'Owner agrees to hold harmless and indemnify {{brand.name}} from any claims or liabilities arising from the condition of the Property or pre-existing hazards, provided that {{brand.name}} is not negligent. {{brand.name}} shall hold harmless and indemnify the Owner from any claims arising directly from the filming activities.',
          clause_type: 'STANDARD',
          order_index: 5,
        },
        {
          title: 'Restoration of Property',
          body: '{{brand.name}} agrees to restore the Property to substantially the same condition as it was prior to filming, normal wear and tear excepted. Any temporary modifications (furniture rearrangement, lighting adjustments, etc.) shall be reversed upon completion of the shoot.',
          clause_type: 'STANDARD',
          order_index: 6,
        },
        {
          title: 'Noise & Disturbance',
          body: '{{brand.name}} shall make reasonable efforts to minimise noise and disturbance to neighbouring properties and shall comply with any local noise regulations. Owner agrees to inform {{brand.name}} of any specific restrictions or sensitivities in advance.',
          clause_type: 'EXTRA',
          order_index: 7,
        },
      ],
    },
  ];

  common.push(...releaseCategories);

  if (countryCode === 'GB') {
    common[7].clauses.push({
      title: 'Governing Law',
      body: 'This agreement shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
      clause_type: 'STANDARD',
      order_index: 2,
    });
    common[6].clauses.push({
      title: 'Data Protection (UK GDPR)',
      body: 'The Provider will process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Personal data will only be used for purposes related to this agreement and will not be shared with third parties without consent.',
      clause_type: 'STANDARD',
      order_index: 1,
    });
  } else if (countryCode === 'US') {
    common[7].clauses.push({
      title: 'Governing Law',
      body: 'This agreement shall be governed by and construed in accordance with the laws of the State in which the Provider is registered, without regard to its conflict of law provisions.',
      clause_type: 'STANDARD',
      order_index: 2,
    });
    common[7].clauses.push({
      title: 'Dispute Resolution',
      body: 'Any disputes arising under this agreement shall first be resolved through mediation. If mediation fails, disputes shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association.',
      clause_type: 'EXTRA',
      order_index: 3,
    });
  } else {
    common[7].clauses.push({
      title: 'Governing Law',
      body: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Provider operates.',
      clause_type: 'STANDARD',
      order_index: 2,
    });
  }

  return common;
}
