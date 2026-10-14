/**
 * Raw colors, lengths and durations are only allowed in token files.
 * Everywhere else must reference a `var(--sk-*)` token.
 */
const config = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    // Tailwind v4 at-rules.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'custom-variant',
          'variant',
          'utility',
          'apply',
          'source',
          'reference',
          'plugin',
          'config',
        ],
      },
    ],
    'at-rule-no-deprecated': [true, { ignoreAtRules: ['apply'] }],
    'import-notation': 'string',
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        'background',
        'border-radius',
        'transition-duration',
        'animation-duration',
        'transition-timing-function',
        'z-index',
      ],
      {
        ignoreValues: [
          'inherit',
          'initial',
          'unset',
          'currentcolor',
          'transparent',
          'none',
          '0',
          'auto',
          'Canvas',
          'CanvasText',
          'Highlight',
          'HighlightText',
          'ButtonText',
          'ButtonFace',
          'GrayText',
          'LinkText',
          'Mark',
          'MarkText',
          'AccentColor',
          'AccentColorText',
          'Field',
          'FieldText',
          'SelectedItem',
          'SelectedItemText',
        ],
        disableFix: true,
      },
    ],
  },
  overrides: [
    {
      // Token files are where raw values live.
      files: ['src/slotkit/tokens/**/*.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
        // Theme-independent and color tokens are kept in separate :root blocks on purpose.
        'no-duplicate-selectors': null,
        // Tailwind's @custom-variant bodies use `&` without an outer rule; Tailwind supplies it.
        'nesting-selector-no-missing-scoping-root': null,
      },
    },
  ],
};

export default config;
