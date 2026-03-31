/** Bump this any time the default questions change to auto-reset stale templates. */
export const TEMPLATE_VERSION = 15;

export interface DefaultQuestionTemplate {
    order_index: number;
    section: string;
    prompt: string;
    script_hint: string;
    field_type: string;
    field_key: string;
    required: boolean;
    visibility: string;
    options?: { values: string[] };
}

export const DEFAULT_DISCOVERY_QUESTIONS: DefaultQuestionTemplate[] = [
    // ── Call Opening ────────────────────────────────────────────────
    {
        order_index: 1,
        section: 'Call Opening',
        prompt: 'Open the call warmly, reference their wizard submission, and set expectations.',
        script_hint: '"Hey {{customer_name}}! So great to finally connect. Thanks for making the time."\n\n"And thank you so much for putting all your wedding details together before this call. It gave me a perfect picture of your day, so we can skip the basic logistics and just focus on the fun stuff."\n\n"Since we only have about 15 minutes, my goal today is just to put a face to the name, hear a bit more about what you care about most, and walk you through the package you built so we can get your date secured. Sound good?"\n\n"Just a heads up, I\'ve got an AI note-taker running in the background so I can just focus on chatting with you rather than typing. Let me know if you\'d rather I turn it off!"',
        field_type: 'script_only',
        field_key: 'opening_notes',
        required: false,
        visibility: 'internal',
    },

    // ── Phase 1: The Connection ───────────────────────────────────
    {
        order_index: 10,
        section: 'The Connection',
        prompt: 'What made you choose your venue?',
        script_hint: '"So, I see you\'re getting married at {{venue_name}} on {{wedding_date}}. I love that spot. What made you guys choose that venue?"',
        field_type: 'textarea',
        field_key: 'venue_story',
        required: false,
        visibility: 'both',
    },
    {
        order_index: 11,
        section: 'The Connection',
        prompt: 'How did you two meet, and what was the proposal like?',
        script_hint: '"And I actually don\'t think it was on the form — how did you two meet? What was the proposal like?"',
        field_type: 'textarea',
        field_key: 'couple_story',
        required: false,
        visibility: 'both',
    },

    // ── Phase 2: The Discovery ──────────────────────────────────────
    {
        order_index: 12,
        section: 'The Discovery',
        prompt: 'What part of the day are you two personally most excited for?',
        script_hint: '"Looking at your timeline, you\'ve got a great flow to the day. Every wedding has its own unique rhythm — some couples are all about the romantic, quiet moments in the morning, and others just want to fast-forward to the wild dance floor. What part of the day are you two personally most excited for?"',
        field_type: 'textarea',
        field_key: 'most_excited',
        required: false,
        visibility: 'both',
    },
    {
        order_index: 13,
        section: 'The Discovery',
        prompt: 'When you picture watching this film on your 10-year anniversary, what are the core memories or people you absolutely want to see?',
        script_hint: '"When you picture yourselves sitting on the couch watching this film on your 10-year anniversary, what are the core memories or people you absolutely want to see?"',
        field_type: 'textarea',
        field_key: 'must_have_shots',
        required: false,
        visibility: 'both',
    },
    {
        order_index: 14,
        section: 'The Discovery',
        prompt: 'How do you both feel about being on camera?',
        script_hint: '"One thing I always like to check: how do you both feel about being on camera? Most couples say \'awkward\' — if that\'s you, don\'t worry. My style is completely documentary. I\'ll be a fly on the wall. No weird, stiff poses, I promise."',
        field_type: 'select',
        field_key: 'camera_comfort',
        required: false,
        options: { values: ['Love it — we\'re natural on camera', 'Comfortable but not camera-obsessed', 'A little nervous but happy to trust the process', 'Really prefer to barely notice the camera'] },
        visibility: 'both',
    },
    {
        order_index: 15,
        section: 'The Discovery',
        prompt: 'What style of filmmaking resonates most with you?',
        script_hint: '"Now that I know how you feel about the camera — have you spotted anything on our Instagram or website that really stood out? A colour grade, an edit style, a moment that got you?"',
        field_type: 'multiselect',
        field_key: 'style_preferences',
        required: false,
        options: { values: ['Cinematic & dramatic', 'Documentary / natural', 'Storytelling / narrative', 'Music-driven edit', 'Light & airy', 'Emotional & raw', 'Not sure yet'] },
        visibility: 'both',
    },

    // ── Phase 3: The Solution ───────────────────────────────────────
    {
        order_index: 16,
        section: 'The Solution',
        prompt: 'Walk through the package they built and confirm it feels right.',
        script_hint: '"Alright, let\'s talk about the coverage you built. You selected the {{package_name}}, which gives us {{coverage_hours}} and the {{deliverables}}."\n\n"To give you an idea of what that actually looks like: {{coverage_hours}} is the perfect sweet spot. It allows me to arrive just in time to capture the final touches of hair and makeup, right through to the first few big songs on the dance floor. And for the film itself, a {{highlight_length}}-minute highlight is my favourite to edit — it gives us enough time to let the vows and speeches breathe, while keeping the energy high so your friends and family will actually want to watch the whole thing."\n\n"You noted your budget was around {{budget_range}}, and this exact setup comes to {{exact_price}}. Based on what you selected in the wizard, we\'d split the payments into {{payment_terms}}. That works perfectly on my end — does everything still feel comfortable for you?"',
        field_type: 'textarea',
        field_key: 'solution_notes',
        required: false,
        visibility: 'internal',
    },
    {
        order_index: 17,
        section: 'The Solution',
        prompt: 'How does the pricing feel relative to their budget?',
        script_hint: '"I just want to make sure whatever I put together actually works for you — no pressure at all."',
        field_type: 'select',
        field_key: 'budget_fit',
        required: false,
        options: { values: ['Comfortably within budget', 'Slightly over — open to discussing', 'At the top of our range', 'A bit of a stretch right now', 'Needs adjustment'] },
        visibility: 'internal',
    },

    // ── Phase 4: The Close ──────────────────────────────────────────
    {
        order_index: 18,
        section: 'The Close',
        prompt: 'Do you have any final questions for me before I send that over to your email?',
        script_hint: '"Honestly guys, your plans sound incredible. I would absolutely love to be the one to capture this for you."\n\n"My next step is to send over the official proposal and the contract so you can read through the fine print."\n\n"To give you a timeline on my end: I currently have your date temporarily held, and I will keep it locked for the next 48 hours while you review the contract. After that, I just have to open the date back up to other inquiries."\n\n"Do you have any final questions for me before I send that over to your email?"',
        field_type: 'textarea',
        field_key: 'final_questions',
        required: false,
        visibility: 'both',
    },
];
