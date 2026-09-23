---
layout: home
title: PhilHealth eClaims Dev Docs

hero:
  name: PhilHealth eClaims
  text: Developer docs for PECWS 3.0
  tagline: A plain-language guide to PhilHealth's e-Claims Web Service DevKit (rev. 2025-02-17). It is written for junior developers, and every statement links back to the original PhilHealth file.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started/
    - theme: alt
      text: API reference
      link: /api/
    - theme: alt
      text: Known issues
      link: /known-issues

features:
  - title: Understand the flow
    details: See how eligibility, claim XML, attachments, upload, status, and payment fit together, and which API method you call at each step.
    link: /getting-started/claims-lifecycle
    linkText: The claims lifecycle
  - title: Get encryption right
    details: PECWS uses two different encryption schemes. Learn which one to use when, with tested Node.js and Python examples.
    link: /guides/encryption/
    linkText: Encryption overview
  - title: Every API method, one layout
    details: 19 methods, each with its request, response, decrypted result, examples, and the gotchas the official guide doesn't mention.
    link: /api/
    linkText: API reference
  - title: Every XML field explained
    details: eClaims, eSOA, CF5 (DRG), CF4, and data-migration XML, field by field, with DTD-validated examples.
    link: /reference/eclaims-xml
    linkText: XML reference
  - title: Outdated content flagged
    details: The DevKit spans 2010–2025. Conflicts, expired files, and typos are tracked in one register and flagged wherever they matter.
    link: /known-issues
    linkText: Known issues
  - title: Original files, one click away
    details: All 43 original DevKit files plus the complete bundle zip, unmodified, with dates, status, and deep links to the exact PDF page.
    link: /sources/
    linkText: Source files
---

## Before you start

::: warning Unofficial documentation
This site is **not** published or endorsed by PhilHealth (Philippine Health Insurance Corporation). It restates the official DevKit in plainer language and links every statement to the original files. Where the official files disagree, we show both versions and say which one we recommend. Always confirm important details with PhilHealth.
:::

::: danger Three things that trip up almost everyone
1. **The bundled PhilHealth public key is an expired test certificate** (valid until 2014-12-29). Ask PhilHealth for the current one. See [KI-01](/known-issues#ki-01).
2. **API payloads and attachments use different encryption.** Payloads use your facility's *cipher key*; attachments use *PhilHealth's public key*. See [Encryption overview](/guides/encryption/).
3. **`pUserName` in the eClaims XML must be `":"` followed by your software certificate ID.** The older header-based method was removed. See [KI-03](/known-issues#ki-03).
:::

**New here?** Check the [prerequisites](/getting-started/prerequisites) first: what you need from PhilHealth before you can call PECWS, and what you can build while you wait. Then follow the [suggested reading order](/getting-started/how-to-read#suggested-reading-order-for-new-developers): Overview → The claims lifecycle → Encryption overview → API overview → Submitting a claim.
