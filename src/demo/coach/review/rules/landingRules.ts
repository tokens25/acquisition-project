import type { ContentRule } from './types'

/**
 * The landing page's written-down rules.
 *
 * Read this file to know what the Coach checks on a page — it is the list,
 * not a summary of one. Anything that needs judgement rather than a
 * condition lives in `landing/brains.ts` and runs beside these.
 *
 * Each rule earns its severity from what it can quote. A component that is
 * on and empty is a fault the page itself shows, so it is a Fix. A heading
 * that runs long is a reading against established science, so it is a Check
 * — and the guard downstream would hold it there anyway.
 */
export const LANDING_RULES: ContentRule[] = [
  {
    id: 'component-empty',
    brain: 'clarity',
    criterion: 'decision-clarity',
    sciences: ['processing-fluency'],
    severity: 'fix',
    look: { at: 'each-component', field: 'words' },
    when: { is: 'empty' },
    say: ({ what }) => ({
      observation: `${what} is switched on and says nothing.`,
      interpretation: 'The page draws an empty block, which reads as something that failed to load.',
      recommendation: `Write ${what}, or switch it off until it has something to say.`,
    }),
  },
  {
    id: 'component-placeholder',
    brain: 'clarity',
    criterion: 'decision-clarity',
    sciences: ['processing-fluency'],
    severity: 'fix',
    look: { at: 'each-component', field: 'heading' },
    when: { is: 'placeholder' },
    say: ({ what, text }) => ({
      observation: `${what} still shows placeholder wording: “${text}”.`,
      interpretation: 'Placeholder wording tells the reader the page is unfinished.',
      recommendation: 'Replace it with the words this market means to say.',
    }),
  },
  {
    id: 'heading-length',
    brain: 'copy',
    criterion: 'decision-clarity',
    sciences: ['processing-fluency', 'cognitive-load'],
    severity: 'check',
    confidence: 'medium',
    look: { at: 'each-component', field: 'heading' },
    when: { is: 'longer-than', words: 12 },
    say: ({ what, count }) => ({
      observation: `${what}'s heading runs to ${count} words.`,
      interpretation: 'A heading that long is read as a paragraph, and paragraphs are skipped.',
      recommendation: 'Shorten it, or move the detail into the line under it.',
    }),
  },
  {
    id: 'hero-heading-length',
    brain: 'copy',
    criterion: 'decision-clarity',
    sciences: ['processing-fluency'],
    severity: 'check',
    confidence: 'medium',
    look: { at: 'field', name: 'the hero heading' },
    when: { is: 'longer-than', words: 10 },
    say: ({ count }) => ({
      observation: `The hero's heading runs to ${count} words, over a picture.`,
      interpretation: 'The first line of the page is read in a glance, and a glance is about six words.',
      recommendation: 'Shorten it, or move the rest into the line under it.',
    }),
  },
  {
    id: 'hero-heading-empty',
    brain: 'clarity',
    criterion: 'decision-clarity',
    sciences: ['processing-fluency'],
    severity: 'fix',
    look: { at: 'field', name: 'the hero heading' },
    when: { is: 'empty' },
    say: () => ({
      observation: 'The hero has no heading.',
      interpretation: 'The picture arrives with nothing saying what the page is for.',
      recommendation: 'Write the heading on the Hero banner tab.',
    }),
  },
  {
    id: 'cta-repeated',
    brain: 'copy',
    criterion: 'decision-clarity',
    sciences: ['consistency-check'],
    severity: 'check',
    look: { at: 'each-component', field: 'cta' },
    when: { is: 'repeated' },
    say: ({ text, count }) => ({
      observation: `“${text}” is the button on ${count} components.`,
      interpretation:
        'The same words in two places either lead to the same thing, in which case one is spare, or to different things, in which case the words are wrong.',
      recommendation: 'Say what each one does, or keep one of them.',
    }),
  },
  {
    id: 'heading-repeated',
    brain: 'copy',
    criterion: 'journey-consistency',
    sciences: ['consistency-check'],
    severity: 'check',
    look: { at: 'each-component', field: 'heading' },
    when: { is: 'repeated' },
    say: ({ text, count }) => ({
      observation: `${count} components are headed “${text}”.`,
      interpretation: 'Two blocks under one heading read as one block that repeated itself.',
      recommendation: 'Give each its own heading, or keep one of them.',
    }),
  },
  {
    id: 'zip-after-plans',
    brain: 'journey',
    criterion: 'journey-consistency',
    sciences: ['mental-models'],
    severity: 'check',
    confidence: 'medium',
    look: { at: 'component', type: 'zip' },
    when: { is: 'after', type: 'plans' },
    say: () => ({
      observation: 'The postcode is asked for after the plans are shown.',
      interpretation:
        'The postcode decides which teams this region gets, so a reader compares plans before knowing what is in them.',
      recommendation: 'Consider putting the postcode above the plans.',
    }),
  },
  {
    id: 'area-missing',
    brain: 'trust',
    criterion: 'purchase-confidence',
    sciences: ['expectation-confirmation'],
    severity: 'fix',
    look: { at: 'component', type: 'area' },
    when: { is: 'absent' },
    given: { component: 'zip', on: true },
    say: () => ({
      observation: 'The page asks for a postcode but has no answer for one outside the region.',
      interpretation:
        'Somebody outside the region is asked a question the page has no reply to, which is where they leave.',
      recommendation: 'Put Outside the area back on the page.',
    }),
  },
]
