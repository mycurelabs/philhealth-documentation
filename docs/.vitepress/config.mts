import { defineConfig } from 'vitepress'

// Links to these file types point at raw files in docs/public/originals,
// not at pages. Without this, VitePress would rewrite them as page links.
process.env.VITE_EXTRA_EXTENSIONS = 'dtd,pem,xlsx,php,cs,enc,bat,py'

const repo = 'https://github.com/mycurelabs/philhealth-documentation'

export default defineConfig({
  title: 'PhilHealth eClaims Dev Docs',
  description:
    'Developer-friendly documentation for the PhilHealth eClaims Web Service (PECWS 3.0) DevKit, with links to every original file.',
  lang: 'en-US',
  base: '/philhealth-documentation/',
  cleanUrls: true,
  lastUpdated: false,

  head: [['meta', { name: 'theme-color', content: '#0f7a3d' }]],

  // Code files embedded with `<<< @/public/examples/...` get their language from the extension.
  markdown: { languageAlias: { mjs: 'js' } },

  themeConfig: {
    nav: [
      { text: 'Getting started', link: '/getting-started/' },
      { text: 'Guides', link: '/guides/encryption/' },
      { text: 'API', link: '/api/' },
      { text: 'Reference', link: '/reference/eclaims-xml' },
      {
        text: 'Resources',
        items: [
          { text: 'Original source files', link: '/sources/' },
          { text: 'Known issues & discrepancies', link: '/known-issues' },
          { text: 'Revision history', link: '/changelog' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Overview', link: '/getting-started/' },
          { text: 'Prerequisites', link: '/getting-started/prerequisites' },
          { text: 'How to read these docs', link: '/getting-started/how-to-read' },
          { text: 'The claims lifecycle', link: '/getting-started/claims-lifecycle' },
          { text: 'Glossary', link: '/getting-started/glossary' },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Encryption',
            collapsed: false,
            items: [
              { text: 'Overview: two schemes', link: '/guides/encryption/' },
              { text: 'API payloads (cipher key)', link: '/guides/encryption/api-payloads' },
              { text: 'Attachments (public key)', link: '/guides/encryption/attachments' },
            ],
          },
          { text: 'Submitting a claim', link: '/guides/submitting-a-claim' },
          { text: 'Building the eSOA', link: '/guides/esoa' },
          { text: 'Building CF5 (DRG)', link: '/guides/cf5' },
          { text: 'Building CF4', link: '/guides/cf4' },
          { text: 'Validating XML locally', link: '/guides/validating-xml' },
          { text: 'Migrating data between providers', link: '/guides/data-migration' },
          { text: 'Software certification (SSVTF)', link: '/guides/certification' },
        ],
      },
      {
        text: 'API reference',
        items: [
          { text: 'Overview & conventions', link: '/api/' },
          {
            text: 'Authentication',
            collapsed: false,
            items: [{ text: 'getToken', link: '/api/get-token' }],
          },
          {
            text: 'Claim submission',
            collapsed: false,
            items: [
              { text: 'validateeSOA', link: '/api/validate-esoa' },
              { text: 'validateCF5', link: '/api/validate-cf5' },
              { text: 'eClaimsFileCheck', link: '/api/eclaims-file-check' },
              { text: 'uploadeClaims', link: '/api/upload-eclaims' },
              { text: 'addRequiredDocument', link: '/api/add-required-document' },
            ],
          },
          {
            text: 'Tracking & payment',
            collapsed: false,
            items: [
              { text: 'getUploadedClaimsMap', link: '/api/get-uploaded-claims-map' },
              { text: 'getClaimStatus', link: '/api/get-claim-status' },
              { text: 'getVoucherDetails', link: '/api/get-voucher-details' },
            ],
          },
          {
            text: 'Eligibility',
            collapsed: false,
            items: [
              { text: 'isClaimEligible', link: '/api/is-claim-eligible' },
              { text: 'generatePBEFPDF', link: '/api/generate-pbef-pdf' },
            ],
          },
          {
            text: 'Lookups',
            collapsed: false,
            items: [
              { text: 'searchCaseRates', link: '/api/search-case-rates' },
              { text: 'getMemberPIN', link: '/api/get-member-pin' },
              { text: 'getDoctorPAN', link: '/api/get-doctor-pan' },
              { text: 'isDoctorAccredited', link: '/api/is-doctor-accredited' },
              { text: 'searchEmployer', link: '/api/search-employer' },
            ],
          },
          {
            text: 'Server utilities',
            collapsed: true,
            items: [
              { text: 'getServerVersion', link: '/api/get-server-version' },
              { text: 'getServerDateTime', link: '/api/get-server-date-time' },
              { text: 'getDBServerDateTime', link: '/api/get-db-server-date-time' },
            ],
          },
          { text: 'Removed methods', link: '/api/removed-methods' },
        ],
      },
      {
        text: 'XML & data reference',
        items: [
          { text: 'eClaims XML', link: '/reference/eclaims-xml' },
          { text: 'Code tables', link: '/reference/code-tables' },
          { text: 'Document type codes', link: '/reference/document-types' },
          { text: 'eSOA XML', link: '/reference/esoa-xml' },
          { text: 'CF5 XML (DRG)', link: '/reference/cf5-xml' },
          { text: 'CF4 XML', link: '/reference/cf4-xml' },
          { text: 'Data migration XML', link: '/reference/migration-xml' },
          { text: 'eSOA libraries', link: '/reference/libraries/esoa' },
          { text: 'CF4 libraries', link: '/reference/libraries/cf4' },
          { text: 'DRG error codes', link: '/reference/drg-error-codes' },
          { text: 'Encryption demo kits', link: '/reference/demo-kits' },
          { text: 'Test data', link: '/reference/test-data' },
        ],
      },
      {
        text: 'Resources',
        items: [
          { text: 'Original source files', link: '/sources/' },
          { text: 'Known issues & discrepancies', link: '/known-issues' },
          { text: 'Revision history', link: '/changelog' },
        ],
      },
    ],

    search: { provider: 'local' },
    outline: { level: [2, 3] },
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Suggest a change to this page',
    },
    footer: {
      message:
        'Unofficial developer documentation based on the PhilHealth PECWS 3.0 DevKit (rev. 2025-02-17). Not affiliated with or endorsed by PhilHealth. Always confirm with PhilHealth.',
      copyright: 'Original DevKit files © Philippine Health Insurance Corporation.',
    },
  },
})
