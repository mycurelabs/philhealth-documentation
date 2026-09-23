---
title: How to read these docs
description: What the badges and callouts mean, how sources are cited, and which document wins when the official sources disagree.
---

# How to read these docs

This site is a developer-friendly rewrite of the **PhilHealth PECWS 3.0 DevKit** (revision 2025-02-17). The DevKit is the set of PDFs, DTDs, spreadsheets, and demo code that PhilHealth distributes to hospitals and IT service providers. This page explains how to read this site and how much to trust each part.

::: warning Unofficial documentation
This site is **not** published or endorsed by PhilHealth (Philippine Health Insurance Corporation). We link every statement back to the original DevKit files so you can check it yourself. When the official files are unclear, we say so. When something matters (money, patient data, certification), confirm it with PhilHealth.
:::

## Every page links to its sources

Near the top of each page you'll find a box like this:

::: info Sources
- [Implementation Guide (rev. 20250217), p. 19–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd)
:::

Links go straight to the original, unmodified files. They are hosted on this site under `/originals/` and listed in [Original source files](/sources/).

- **PDF page numbers are the PDF viewer's page numbers**, starting at 1 for the cover. They are *not* the numbers printed in the footer. For example, the Implementation Guide's footer "1 | Page" is PDF page 6. Links include `#page=N`, so most browsers open the PDF on the right page.
- Important tables and rules also carry an inline citation, such as "([Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88))".

## Badges

Badges appear next to page titles, on the [source files](/sources/) list, and on each [known issue](/known-issues). The same word always has the same meaning:

| Badge | Meaning |
|---|---|
| <Badge type="tip" text="Current" /> | Matches the newest official documents in the DevKit. |
| <Badge type="warning" text="Conflicting sources" /> | Two official documents disagree. The page shows both versions and explains which one we recommend. |
| <Badge type="danger" text="Outdated" /> | Superseded by a newer document, removed, or expired. Don't build new code on it. |
| <Badge type="info" text="Reference only" /> | Useful for understanding, but not for copying as-is (for example, the demo kits). |
| <Badge type="warning" text="Gap" /> | The DevKit doesn't say. You'll have to confirm with PhilHealth. |
| <Badge type="info" text="Typo" /> | A harmless mistake in an official document. Use the corrected meaning. |
| <Badge type="warning" text="Easy to confuse" /> | Correct but easy to misread. Read carefully. |
| <Badge type="warning" text="Data quality" /> | A PhilHealth spreadsheet contains bad or damaged values. |
| <Badge type="danger" text="Security" /> <Badge type="danger" text="Bug" /> | Demo code that is insecure or broken. Never copy it. |
| <Badge type="danger" text="Tooling" /> | Common tools give wrong results with the official files. |
| <Badge type="danger" text="Expires 2026-12-31" /> | Test data that stops working on that date. |

## Callouts

Callout boxes are colored by type:

::: tip Tip
Tip boxes hold practical advice. **When advice is ours and not PhilHealth's, the box or sentence says so**, for example "Recommendation (not from PhilHealth)".
:::

::: info
Info boxes hold background, such as the "Sources" list at the top of each page.
:::

::: warning
Warning boxes flag a conflict, a gap, or a trap. They usually link to a numbered entry in [Known issues](/known-issues), such as [KI-05](/known-issues#ki-05).
:::

::: danger
Danger boxes flag something outdated, removed, insecure, or likely to get your claims rejected.
:::

## Which source wins? (precedence rules) {#which-source-wins-precedence-rules}

The DevKit was written over many years, so its documents sometimes disagree. We apply these rules everywhere on this site:

1. **The newest dated official document wins.** The baseline is **revision 20250217**: the Implementation Guide, the DevKit Revision History, and the certification test form are all dated 17–18 February 2025. The attachment-encryption guideline, created 2025-03-14, is the newest file.
2. **For XML structure, the DTD wins.** A DTD (Document Type Definition) is the machine-readable schema that PhilHealth validates XML against. Prose, data dictionaries, and samples can be wrong about structure. Data dictionaries still matter: they add field lengths, formats, and business rules that a DTD can't express.
3. **If a DTD printed in the Guide differs from the standalone `.dtd` file**, we prefer the DTD whose *own* revision date is newer, even when the document that prints the other one is newer. For example, the 2025 Guide still prints the 2024-02 CF5 DTD ([KI-06](/known-issues#ki-06)). We show both versions and tell you how to confirm with PhilHealth's validator endpoints: [`validateeSOA`](/api/validate-esoa), [`validateCF5`](/api/validate-cf5), and [`eClaimsFileCheck`](/api/eclaims-file-check).
4. **Samples are illustrations, not rules.** Many official samples contain fake hashes, totals that don't add up, or even invalid JSON or XML ([KI-27](/known-issues#ki-27), [KI-28](/known-issues#ki-28), [KI-34](/known-issues#ki-34)).
5. **When still unsure, ask PhilHealth.** The eSOA circular PC 2023-0026 tells health facilities and service providers to coordinate with the *Unified PhilHealth Electronic Claims System – Electronic Medical Record (UPECS-EMR) Team* for updated DTD and XML formats ([PC 2023-0026, p. 6](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=6)).

## Placeholders and conventions

| You see | It means |
|---|---|
| `{pecws.domain}` | The PECWS host name. It is not in the DevKit; get it from PhilHealth ([KI-30](/known-issues#ki-30)). |
| `MM-DD-YYYY` | The date format used by eClaims XML, eSOA XML, and the API. **CF4 uses `YYYY-MM-DD`** ([KI-08](/known-issues#ki-08)). |
| `CF1`…`CF5` | PhilHealth Claim Forms 1–5. See the [Glossary](/getting-started/glossary). |
| `KI-NN` | An entry in the [Known issues](/known-issues) register. |
| "Guide" | The [PhilHealth Electronic Claims Implementation Guide for PECWS 3.0 (Revised 20250217)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf). |
| "Annex A" … "Annex F" | Unless stated otherwise, an annex of the **Guide**: [A](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) = payload encryption with the cipher key (p. 75–76); [B](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) = document type codes (p. 77–78); [C](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) = eClaims data dictionary (p. 79–85); [D](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86) = eSOA data dictionary (p. 86–87); [E](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88) = CF5 data dictionary (p. 88); [F](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89) = eSOA libraries (p. 89–188). Other documents reuse the letters, and we always name them: "SSVTF Annex A/B" (certification annexes), "PC 2023-0026 Annex A/B" (the eSOA circular's annexes). The CF4 data dictionary is labeled "Annex G". |
| `/examples/...` | Unofficial example files written for this site and validated against the official DTDs. They are not PhilHealth files. |

## Suggested reading order for new developers

1. [Overview](/getting-started/): what PECWS is.
2. [Prerequisites](/getting-started/prerequisites): what you need from PhilHealth, the facility, and your own setup before you can call PECWS, and what you can build while you wait.
3. [The claims lifecycle](/getting-started/claims-lifecycle): the big picture.
4. [Encryption overview](/guides/encryption/): read this before writing any code.
5. [API overview & conventions](/api/), then [getToken](/api/get-token).
6. [Submitting a claim](/guides/submitting-a-claim): the step-by-step tutorial.
7. The XML references you need: [eClaims](/reference/eclaims-xml), [eSOA](/reference/esoa-xml), [CF5](/reference/cf5-xml), [CF4](/reference/cf4-xml).
8. [Software certification](/guides/certification): what PhilHealth tests before you go live.
9. [Known issues](/known-issues): skim it once, then come back when something looks wrong.
