# PhilHealth eClaims (PECWS 3.0) developer documentation

A developer-friendly documentation site for the **PhilHealth e-Claims Web Service (PECWS) 3.0 DevKit**, revision 2025-02-17. It turns PhilHealth's raw DevKit (a 188-page implementation guide, DTDs, spreadsheets, scanned circulars, and demo code) into clear, searchable pages written for junior developers. **Every statement links back to the original file**, and outdated or conflicting material is flagged.

- **Site:** https://mycurelabs.github.io/philhealth-documentation/ (after GitHub Pages is enabled; see [Deploying](#deploying))
- **Built with:** [VitePress](https://vitepress.dev/) (Markdown + built-in local search)

> **Unofficial.** This project is not published or endorsed by PhilHealth. The original files in `docs/public/originals/` are © Philippine Health Insurance Corporation and are included unmodified for reference.

## Repository layout

```text
.
├── docs/                          VitePress site source (Markdown)
│   ├── .vitepress/config.mts      Site config: navigation, sidebar, search
│   ├── index.md                   Home page
│   ├── getting-started/           Concepts: overview, how to read, lifecycle, glossary
│   ├── guides/                    How-to guides (encryption, eSOA, CF5, CF4, submission, validation, migration, certification)
│   ├── api/                       One page per PECWS API method
│   ├── reference/                 XML formats, code tables, libraries, error codes, demo kits, test data
│   ├── known-issues.md            Register of outdated/conflicting/incorrect DevKit content (KI-01 … KI-64)
│   ├── changelog.md               Consolidated revision history of all DevKit documents
│   ├── sources/index.md           Catalog of every original file
│   └── public/
│       ├── originals/             The original DevKit files, unmodified, organized by topic
│       │   ├── philhealth-docs.zip    Complete DevKit bundle as received
│       │   ├── implementation-guide/  Implementation Guide + DevKit revision history
│       │   ├── eclaims-xml/           eClaimsDef.dtd + NetBeans validation how-to
│       │   ├── esoa/                  ESOA.dtd, circular PC 2023-0026, eSOA libraries
│       │   ├── cf5/                   CF5 DTD, DRG sample XML, CF5 form, DRG error codes
│       │   ├── cf4/                   CF4 DTD, data dictionary, form, libraries/
│       │   ├── encryption/            Attachment-encryption guideline, public key, demo kits (+ extracted sources)
│       │   ├── data-migration/        Migration DTD + data dictionary
│       │   ├── certification/         Software Solution Validation Test Form (SSVTF) + annexes
│       │   └── test-data/             Dummy providers and employers
│       └── examples/              Unofficial examples written for this site (not from PhilHealth)
│           ├── *.xml                  One shared example claim as eClaims, eSOA, CF5, CF4, and migration XML (DTD-validated)
│           ├── encryption/            Tested payload and attachment encryption code (Node.js, Python, PHP)
│           └── client/                Shared PECWS API client used by every code snippet (Node.js, Python)
├── .github/workflows/deploy-docs.yml   Builds and deploys the site to GitHub Pages
└── package.json
```

Original file names are kept exactly as PhilHealth distributed them, so you can match them with copies you receive. Only the folder layout changed. [`docs/sources/index.md`](docs/sources/index.md) maps every file's original path in the DevKit to its new location.

## Running the site locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run docs:dev       # dev server with hot reload at http://localhost:5173/philhealth-documentation/
npm run docs:build     # production build into docs/.vitepress/dist
npm run docs:preview   # preview the production build
```

## Deploying

The workflow in `.github/workflows/deploy-docs.yml` builds the site and publishes it to GitHub Pages on every push to `main`.

One-time setup: in the GitHub repository, open **Settings → Pages → Build and deployment**, and set **Source** to **GitHub Actions**.

The site is configured for `https://<org>.github.io/philhealth-documentation/` (`base` in `docs/.vitepress/config.mts`). If you rename the repository or use a custom domain, update `base`.

## Writing and editing pages

- Put **every factual statement** on a traceable source. Each page has a `::: info Sources` box. Link to originals with percent-encoded paths, and add `#page=N` for PDFs. `N` is the **PDF page index**, not the printed footer number.
- When sources disagree or are outdated, don't pick silently. Add a callout and link to the matching entry in `docs/known-issues.md` (for example `/known-issues#ki-05`). Add a new `KI-NN` entry if needed.
- Label your own advice as a recommendation, so readers can tell it apart from PhilHealth's rules.
- Validate any example XML against its DTD before committing, for example with Python and lxml:
  ```bash
  python -c "from lxml import etree; d=etree.DTD(open('docs/public/originals/esoa/ESOA.dtd','rb')); print(d.validate(etree.parse('docs/public/examples/esoa-sample.xml')), d.error_log)"
  ```
  The eClaims and data-migration DTDs contain non-deterministic content models that libxml2-based tools (lxml, xmllint) reject for *every* file ([KI-43](docs/known-issues.md#ki-43)). For those two, use Java or the patched-DTD method described in `docs/guides/validating-xml.md`.
- Don't modify files in `docs/public/originals/`. When PhilHealth releases a new DevKit, add the new files, update `docs/sources/index.md` and `docs/changelog.md`, and review `docs/known-issues.md`.
- Links to `.dtd`, `.pem`, `.xlsx`, `.php`, `.cs`, `.enc`, `.bat`, and `.py` files work because these extensions are registered as plain files at the top of `docs/.vitepress/config.mts`. Register any new extension there too.
