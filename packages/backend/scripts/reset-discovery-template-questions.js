#!/usr/bin/env node
/**
 * Resets the discovery questionnaire template questions to the latest version.
 *
 * - Finds the active template for each brand
 * - Deletes all existing questions for that template
 * - Re-creates them from the updated question set
 *
 * Safe to run repeatedly. Does NOT delete submissions or the template record itself.
 *
 * Usage:
 *   cd packages/backend
 *   node scripts/reset-discovery-template-questions.js
 *
 * Optional: target a single brand by setting BRAND_ID env var
 *   BRAND_ID=1 node scripts/reset-discovery-template-questions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Updated question set ───────────────────────────────────────────────────────

const QUESTIONS = [
    // ── Call Opening ────────────────────────────────────────────────────────
    {
        order_index: 1,
        section: 'Call Opening',
        prompt: 'Open the call warmly, introduce yourself, and set expectations for the conversation.',
        script_hint:
            '"Hey {{customer_name}}! So great to finally connect — thanks so much for making time today."\n\n' +
            '"I\'m {{producer_name}} from {{brand_name}} — I\'ll be your lead producer if we end up working together, so you\'ll have one point of contact from this call right through to your wedding day."\n\n' +
            '"I\'ve set aside about {{call_duration}} minutes for us. By the end of the call I want to know enough about your day to put together a really personalised proposal \u2014 something that actually reflects what matters to you, not a cookie-cutter package."\n\n' +
            '"So the more you share, the better the proposal will be \u2014 don\'t hold back! And please ask me anything too \u2014 this should feel like a proper two-way conversation."',
        field_type: 'textarea',
        field_key: 'opening_notes',
        required: false,
        visibility: 'internal',
        options: null,
    },
    {
        order_index: 2,
        section: 'Call Opening',
        prompt: 'Who am I speaking with today?',
        script_hint:
            '"Just so I get it right — are you the bride, groom, or one of the partners?"\n\n' +
            'This matters because the person who submitted the inquiry isn\'t always the one on the call. Confirm before going further.',
        field_type: 'select',
        field_key: 'speaker_role',
        required: false,
        visibility: 'internal',
        options: JSON.stringify({ values: ['Bride', 'Groom', 'Partner 1', 'Partner 2', 'Other'] }),
    },
    {
        order_index: 3,
        section: 'Call Opening',
        prompt: "What's your name?",
        script_hint:
            '"I may have a name from the inquiry form, but I want to make sure I\'ve got it right — what should I call you?"\n\n' +
            'Always confirm. It\'s a small thing that makes a big impression.',
        field_type: 'text',
        field_key: 'speaker_name',
        required: false,
        visibility: 'internal',
        options: null,
    },
    {
        order_index: 4,
        section: 'Call Opening',
        prompt: "And your partner's name?",
        script_hint:
            '"And remind me — what\'s your partner\'s name?" Use their names naturally throughout the rest of the call. If the pronunciation is unusual, note it now.',
        field_type: 'text',
        field_key: 'partner_name',
        required: false,
        visibility: 'internal',
        options: null,
    },

    // ── Getting to Know You ──────────────────────────────────────────────────
    {
        order_index: 5,
        section: 'Getting to Know You',
        prompt: "What is the bride's full name?",
        script_hint:
            '"I just need to grab both your full names for the proposal — let\'s start with the bride."\n\n' +
            'Get the full legal name (first + surname). Confirm spelling if unusual. This goes straight into the contract and proposal, so accuracy matters.',
        field_type: 'text',
        field_key: 'bride_full_name',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 6,
        section: 'Getting to Know You',
        prompt: "What is the groom's full name?",
        script_hint:
            '"And the groom\'s full name?"\n\n' +
            'Same as above — full legal name for contracts and the proposal. If it\'s a same-sex couple, adapt naturally: "And your partner\'s full name?"',
        field_type: 'text',
        field_key: 'groom_full_name',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 7,
        section: 'Getting to Know You',
        prompt: "When did you get engaged?",
        script_hint:
            '"When did you get engaged? Was it recent or have you been planning for a while?"\n\n' +
            'This is a great warm-up — it naturally leads into their story, and the answer tells you how far into the planning process they are. Recently engaged couples may need more guidance; longer-engaged couples likely have a clearer vision and tighter vendor decisions.',
        field_type: 'text',
        field_key: 'engagement_date',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 8,
        section: 'Getting to Know You',
        prompt: "Tell me about yourselves — how did you meet, and what was the proposal like?",
        script_hint:
            '"I always love hearing this part — would you mind telling me your story?"\n\n' +
            'Then genuinely listen. This section builds trust fast and reveals personality, energy, and emotional anchors. The richer this answer, the better you can tailor everything that follows. Don\'t rush it — the best calls take their time here.',
        field_type: 'textarea',
        field_key: 'couple_story',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 9,
        section: 'Getting to Know You',
        prompt: "What are you most excited about for your wedding day?",
        script_hint:
            'Brilliant emotional temperature check. Their answer reveals what they\'ll want the film to feel like — and what to prioritise in coverage.\n\n' +
            'If they say "speeches", watch how they talk about family. If they say "first dance", music will be emotionally important to them. Reflect it back: "That sounds absolutely wonderful — we\'ll make sure that moment is beautifully captured."',
        field_type: 'textarea',
        field_key: 'most_excited',
        required: false,
        visibility: 'both',
        options: null,
    },

    // ── Creative Vision ──────────────────────────────────────────────────────
    {
        order_index: 10,
        section: 'Creative Vision',
        prompt: "What feeling do you want when you watch your film back in 20 years?",
        script_hint:
            '"If you could describe the film in just three words, what would they be?" — cinematic, emotional, fun, raw, romantic, authentic?\n\n' +
            'Reframing it as \'watching in 20 years\' unlocks much more honest, emotional answers than asking about \'vibe\'.',
        field_type: 'textarea',
        field_key: 'film_vibe',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 11,
        section: 'Creative Vision',
        prompt: "What style of filmmaking resonates most with you?",
        script_hint:
            '"Have you spotted anything on our Instagram or website that really stood out — a colour grade, an edit style, a moment that got you?"\n\n' +
            'Let them pick broad styles first, then probe for specific references. Their answer tells you where to focus your creative energy in the proposal.',
        field_type: 'multiselect',
        field_key: 'style_preferences',
        required: false,
        visibility: 'both',
        options: JSON.stringify({ values: ['Cinematic & dramatic', 'Documentary / natural', 'Storytelling / narrative', 'Music-driven edit', 'Light & airy', 'Emotional & raw', 'Not sure yet'] }),
    },
    {
        order_index: 12,
        section: 'Creative Vision',
        prompt: "Any specific film references or examples you love?",
        script_hint:
            'If they have a reference: "Can you send that over after the call? I\'d love to see what resonated with you — it\'ll really help me tailor the approach."\n\n' +
            'If they\'re drawing a blank: "No worries at all — I\'ll use everything you\'ve shared today to guide the creative direction."',
        field_type: 'textarea',
        field_key: 'style_references',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 13,
        section: 'Creative Vision',
        prompt: "How do you both feel about being on camera?",
        script_hint:
            '"This is honestly one of the most common things couples tell me — it\'s completely normal to feel a bit self-conscious!"\n\n' +
            'For anxious couples: "The way I film, you often forget the camera\'s even there. We focus entirely on real moments as they happen — not posed shots. You\'ll be surprised how natural you look when you\'re just living your day."\n\n' +
            'Their answer shapes your entire filming approach.',
        field_type: 'select',
        field_key: 'camera_comfort',
        required: false,
        visibility: 'both',
        options: JSON.stringify({ values: ['Love it — we\'re natural on camera', 'Comfortable but not camera-obsessed', 'A little nervous but happy to trust the process', 'Really prefer to barely notice the camera'] }),
    },

    // ── Activity & Moment Confirmation ───────────────────────────────────────
    {
        order_index: 14,
        section: 'Activity & Moment Confirmation',
        prompt: "Let's walk through the parts of the day you'd like us to cover.",
        script_hint:
            'Pre-populate from their package selections. Walk through naturally: "So I can see you\'ve got Getting Ready, Ceremony, and First Dance included — does that still feel right? Is there anything you\'d add or change?"\n\n' +
            'This is also a natural upsell moment if something important-looking is missing from the coverage.',
        field_type: 'activity_checklist',
        field_key: 'confirmed_activities',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 15,
        section: 'Activity & Moment Confirmation',
        prompt: "Are there any moments, people, or details that are absolutely must-captures for you?",
        script_hint:
            '"Any non-negotiable moments? Think specific people\'s reactions, particular details, a location shot you\'ve been dreaming of?"\n\n' +
            'Also ask: "Is there anything you\'d prefer we don\'t linger on, or any sensitivities I should be aware of?" — asking the second part builds enormous trust.',
        field_type: 'textarea',
        field_key: 'must_have_shots',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 16,
        section: 'Activity & Moment Confirmation',
        prompt: "Is there anything unique about your celebration — cultural traditions, surprises, special performances?",
        script_hint:
            '"A lot of our couples have things in their day that a typical package builder can\'t anticipate — cultural elements, surprise choreography, memorial tributes, fire performances... anything like that?"\n\n' +
            'These often need extra planning, additional kit, or a second camera operator. Note carefully — they can turn into meaningful add-on conversations.',
        field_type: 'textarea',
        field_key: 'unique_elements',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 17,
        section: 'Activity & Moment Confirmation',
        prompt: "For each part of the day, which specific moments are most important?",
        script_hint:
            '"Within the Ceremony — is it the processional, the vows, that first kiss as a married couple, or all of it?" Work through each activity and flag the key beats.\n\n' +
            'Most couples haven\'t thought at this level of detail before. Walking them through it makes you look incredibly thorough — and it\'s great info for your planning.',
        field_type: 'moment_checklist',
        field_key: 'confirmed_moments',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 18,
        section: 'Activity & Moment Confirmation',
        prompt: "Any moments not on this list you'd love us to capture?",
        script_hint:
            '"We\'ve covered the main events — is there anything else? Even something small, like a quiet moment with a grandparent, or your dress hanging in the morning light?"\n\n' +
            'Often the most meaningful things are the ones couples almost didn\'t mention. Give them space to think.',
        field_type: 'textarea',
        field_key: 'additional_moments',
        required: false,
        visibility: 'both',
        options: null,
    },

    // ── Day Logistics ────────────────────────────────────────────────────────
    {
        order_index: 19,
        section: 'Day Logistics',
        prompt: "Tell me about your venue — filming restrictions, travel between locations, indoor/outdoor mix?",
        script_hint:
            '"I already have the venue name — this is really about the practical stuff."\n\n' +
            'Ask: "Is the ceremony indoors or outside? How far is it between ceremony and reception? Any known restrictions on drones, tripods, or certain areas of the venue?"\n\n' +
            'Note anything that affects your kit list, travel time, or second shooter needs.',
        field_type: 'textarea',
        field_key: 'venue_logistics',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 20,
        section: 'Day Logistics',
        prompt: "Can you walk me through the rough shape of your day?",
        script_hint:
            '"What time does prep start? When\'s the ceremony? Are speeches before or after dinner? First dance — early evening or later in the night?"\n\n' +
            'You don\'t need the exact schedule here, just the shape of it. Pay attention to where downtime might sit — that\'s where you can get creative shots.',
        field_type: 'textarea',
        field_key: 'rough_timeline',
        required: false,
        visibility: 'both',
        options: null,
    },
    {
        order_index: 21,
        section: 'Day Logistics',
        prompt: "Who's your photographer, and are there other key vendors we'd need to coordinate with?",
        script_hint:
            '"The photographer is genuinely our most important collaboration on the day — do you have someone confirmed yet? If so, I\'d love to reach out to them in advance so we\'re aligned."\n\n' +
            'Also worth noting: planner/coordinator, DJ or band, and any entertainers — their timing will directly affect yours.',
        field_type: 'textarea',
        field_key: 'key_vendors',
        required: false,
        visibility: 'both',
        options: null,
    },

    // ── Deliverables & Expectations ──────────────────────────────────────────
    {
        order_index: 22,
        section: 'Deliverables & Expectations',
        prompt: "Which film products are you most drawn to?",
        script_hint:
            '"Your package includes X — are there any additions you\'re thinking about?" If no package yet: "Let me quickly walk you through what we offer — it\'ll help me put the right proposal together."\n\n' +
            'Don\'t mention prices here. Save detailed pricing for the proposal where context makes it easier to digest.',
        field_type: 'multiselect',
        field_key: 'desired_products',
        required: false,
        visibility: 'both',
        options: JSON.stringify({ values: ['Highlight film', 'Full ceremony', 'Full speeches', 'Social media clips', 'Same-day edit', 'Raw footage'] }),
    },
    {
        order_index: 23,
        section: 'Deliverables & Expectations',
        prompt: "How long would you ideally like your highlight film to be?",
        script_hint:
            '"There\'s genuinely no wrong answer here — shorter films (3–5 mins) hit really hard and are perfect for sharing. Longer films (8–12 mins) give us space to let your story breathe and include more of those emotional moments. Some couples actually want both."\n\n' +
            'Let them guide it, then validate their choice. Don\'t steer — you can always guide them in the proposal.',
        field_type: 'select',
        field_key: 'highlight_length',
        required: false,
        visibility: 'both',
        options: JSON.stringify({ values: ['3–5 mins — punchy and shareable', '5–8 mins — balanced', '8–12 mins — room for the full story', 'No preference — trust the edit', 'Not sure yet'] }),
    },
    {
        order_index: 24,
        section: 'Deliverables & Expectations',
        prompt: "How do you picture watching and sharing your film?",
        script_hint:
            '"Will you mainly be sharing it on social media, watching it privately together, or screening it for family? It shapes the edit and how we deliver it."\n\n' +
            'Social-first = different aspect ratios, faster pacing, perhaps vertical cuts. Private/cinematic = full widescreen, slower and more emotional. Important practical detail.',
        field_type: 'multiselect',
        field_key: 'sharing_plans',
        required: false,
        visibility: 'both',
        options: JSON.stringify({ values: ['Share on social media', 'Watch privately together', 'Screen at a gathering or anniversary', 'Send to family who couldn\'t attend', 'Mainly just for us to keep'] }),
    },

    // ── Budget & Fit ─────────────────────────────────────────────────────────
    {
        order_index: 25,
        section: 'Budget & Fit',
        prompt: "Let me quickly confirm the payment terms we'd be working with.",
        script_hint:
            '"Before we talk budget — I just want to quickly run through how payments typically work with us, so there are no surprises."\n\n' +
            'The payment schedule from their inquiry will be displayed here automatically. Walk through each milestone naturally: "So it would be X% on booking, then X% before the day, and the balance after delivery."\n\n' +
            'If they hesitate: "We can absolutely look at adjusting the timing if that helps — the important thing is it works for both of us." Note any requested changes.',
        field_type: 'payment_terms',
        field_key: 'payment_terms_confirmed',
        required: false,
        visibility: 'internal',
        options: null,
    },
    {
        order_index: 26,
        section: 'Budget & Fit',
        prompt: "Just so I can point you in the right direction — how does our pricing feel relative to your budget?",
        script_hint:
            '"I just want to make sure whatever I put together actually works for you — no pressure at all."\n\n' +
            'Don\'t apologise for your pricing. If they\'re stretched, acknowledge it and ask: "What would make this feel more comfortable?" Often flexibility on payment timing helps more than a discount — and preserves your margin.',
        field_type: 'select',
        field_key: 'budget_fit',
        required: false,
        visibility: 'internal',
        options: JSON.stringify({ values: ['Comfortably within budget', 'Slightly over — open to discussing', 'At the top of our range', 'A bit of a stretch right now', 'Prefer not to discuss yet'] }),
    },
    {
        order_index: 27,
        section: 'Budget & Fit',
        prompt: "Have you spoken to any other videographers?",
        script_hint:
            '"No wrong answer at all — it actually helps me understand what\'s been most important to you in your search."\n\n' +
            'If they\'re comparing: "What\'s stood out to you in any of those conversations?" — that\'s genuinely gold for your proposal. Reveals their real decision criteria.',
        field_type: 'select',
        field_key: 'competitors',
        required: false,
        visibility: 'internal',
        options: JSON.stringify({ values: ['No — you\'re our first call', 'Yes — comparing a couple of options', 'Yes — we\'ve had several calls already', 'Not yet but we plan to'] }),
    },
    {
        order_index: 28,
        section: 'Budget & Fit',
        prompt: "What's your timeline for making a decision?",
        script_hint:
            '"No pressure at all — I just want to make sure I follow up at a time that actually suits you rather than bombarding you!"\n\n' +
            'If the date is soon or they\'re urgent: note it and prioritise. If they\'re early in the process: nurture don\'t push — a great proposal and a warm follow-up will do more than chasing.',
        field_type: 'select',
        field_key: 'decision_timeline',
        required: false,
        visibility: 'internal',
        options: JSON.stringify({ values: ['This week', 'Within two weeks', 'Within a month', 'A few months away', 'Just starting to explore'] }),
    },

    // ── Decision & Next Steps ────────────────────────────────────────────────
    {
        order_index: 29,
        section: 'Decision & Next Steps',
        prompt: "Is it the two of you deciding together, or are others involved in the process?",
        script_hint:
            '"Totally fine either way — I just want to make sure whoever needs to see the proposal gets everything they need."\n\n' +
            'Parents involved in funding = very different follow-up strategy. May need to send something more formal or schedule a follow-up call with everyone present.',
        field_type: 'text',
        field_key: 'decision_makers',
        required: false,
        visibility: 'internal',
        options: null,
    },
    {
        order_index: 30,
        section: 'Decision & Next Steps',
        prompt: "What would make this feel like an easy decision for you?",
        script_hint:
            'The single most powerful question in this entire call. Stop talking and listen properly.\n\n' +
            'They will tell you exactly what they need to hear in the proposal — or exactly where their hesitation is. Reflect it back: "That\'s really helpful — I\'ll make sure the proposal addresses that directly."',
        field_type: 'textarea',
        field_key: 'key_decision_factors',
        required: false,
        visibility: 'internal',
        options: null,
    },
    {
        order_index: 31,
        section: 'Decision & Next Steps',
        prompt: "Can I put together a personalised proposal for you?",
        script_hint:
            '"I\'d love to put something together that\'s completely tailored to everything we\'ve talked about today — would that be okay?"\n\n' +
            'A yes is a clear buying signal. Even a "maybe" is meaningful progress. Note any conditions or questions they need answered first — those become the focus of your proposal.',
        field_type: 'select',
        field_key: 'ready_for_proposal',
        required: false,
        visibility: 'internal',
        options: JSON.stringify({ values: ['Yes — please send one over', 'Not quite yet — let me think', 'Maybe — depends on a couple of things', 'We already have a proposal'] }),
    },

    // ── Call Closing ─────────────────────────────────────────────────────────
    {
        order_index: 32,
        section: 'Call Closing',
        prompt: "Wrap up warmly and confirm next steps clearly.",
        script_hint:
            '"{{customer_name}} — thank you so much for chatting with me today. I\'ve genuinely loved getting to know you both and hearing about your plans. Your day sounds absolutely beautiful."\n\n' +
            '"I\'ll have a personalised proposal with you within the next few days — it\'ll be based on everything we\'ve talked about, so it should feel really tailored rather than generic."\n\n' +
            '"In the meantime, if anything comes up or you think of something you forgot to mention, just drop me a message — you\'ve got my details. Really looking forward to hearing what you both think!"\n\n' +
            '"Take care — speak soon!"',
        field_type: 'textarea',
        field_key: 'closing_notes',
        required: false,
        visibility: 'internal',
        options: null,
    },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const targetBrandId = process.env.BRAND_ID ? parseInt(process.env.BRAND_ID) : null;

    const whereClause = {
        is_active: true,
        ...(targetBrandId ? { brand_id: targetBrandId } : {}),
    };

    const templates = await prisma.discovery_questionnaire_templates.findMany({
        where: whereClause,
        select: { id: true, brand_id: true, name: true },
    });

    if (templates.length === 0) {
        console.log('No active discovery questionnaire templates found. Nothing to update.');
        return;
    }

    console.log(`Found ${templates.length} active template(s) to update...\n`);

    for (const template of templates) {
        console.log(`Updating template ID ${template.id} (brand ${template.brand_id}): "${template.name}"`);

        await prisma.$transaction(async (tx) => {
            // Delete existing questions
            const deleted = await tx.discovery_questionnaire_questions.deleteMany({
                where: { template_id: template.id },
            });
            console.log(`  ✓ Removed ${deleted.count} old questions`);

            // Re-create updated questions
            await tx.discovery_questionnaire_questions.createMany({
                data: QUESTIONS.map((q) => ({
                    template_id: template.id,
                    order_index: q.order_index,
                    section: q.section,
                    prompt: q.prompt,
                    script_hint: q.script_hint,
                    field_type: q.field_type,
                    field_key: q.field_key,
                    required: q.required,
                    visibility: q.visibility,
                    options: q.options ? JSON.parse(q.options) : undefined,
                })),
            });
            console.log(`  ✓ Created ${QUESTIONS.length} updated questions`);
        });

        console.log(`  ✅ Template ${template.id} updated successfully\n`);
    }

    console.log('All templates updated. Existing submissions are unaffected.');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
