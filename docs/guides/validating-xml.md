---
title: Validating XML
description: Three ways to check PhilHealth XML files before you upload them (NetBeans, the command line with Java, xmllint or Python, and PhilHealth's validator methods), plus what DTD validation cannot catch.
---

# Validating XML

<Badge type="tip" text="Current: rev. 20250217" /> <Badge type="danger" text="Tooling" />

Every XML file you send to PhilHealth has a Document Type Definition (DTD) that describes its structure. This page shows three ways to check a file against its DTD before you upload it: the NetBeans method from the DevKit, the command line (Java, xmllint, Python lxml), and PhilHealth's own validator methods. It ends with the rules a DTD cannot check, so you know what else to test.

::: info Sources
- [Validating e-Claims XML File in Netbeans (PDF, 2025-02-18)](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf)
- DTDs: [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) (v1.9), [`ESOA.dtd`](/originals/esoa/ESOA.dtd) (v0.5), [`CF5.dtd`](/originals/cf5/CF5.dtd) and [20240604 CF5 DTD PDF](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf), [`CF4.dtd`](/originals/cf4/CF4.dtd) (EPCB 1.20), [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) (v1.0)
- [Implementation Guide (rev. 20250217), p. 9–10, 16–19, 44–45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9): validator methods; p. 17: CF5 DTD v1.3
- [Implementation Guide, Annex C–E, p. 79–88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79): lengths, formats and rules
- [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml) and [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)
- [Software Solution Validation Test Form (SSVTF, rev. 20250217), p. 7–8, 11–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7) and [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf): CF5 counting rules, validation display, Stage 2 checks
- Test runs by this site's authors on 2026-09-23: the commands and outputs on this page
:::

## TL;DR

- **eSOA, CF5 and CF4** (electronic Statement of Account, Claim Form 5 and Claim Form 4): validate against the DTD with any tool, for example `xmllint --noout --dtdvalid ESOA.dtd esoa-sample.xml`.
- **eClaims and data-migration XML:** the published DTDs break libxml2-based tools (xmllint, Python lxml, PHP) ([KI-43](/known-issues#ki-43)). Validate them with [Java](#java-recommended-for-eclaims-and-migration-xml), or use a libxml2 tool with a [patched local copy of the DTD](#the-eclaims-dtd-and-libxml2).
- **Then call PhilHealth's validator methods:** validateeSOA and validateCF5 first, and eClaimsFileCheck last, on the final eClaims XML. There is none for CF4 or for migration files.
- **DTD-valid is not the same as correct.** Lengths, formats, codes and cross-document rules need your own checks. See [What DTD validation cannot catch](#what-dtd-validation-cannot-catch).

## Which DTD for which file

| File | Root element | DTD to use | Unofficial example | Notes |
|---|---|---|---|---|
| eClaims XML (the claim) | `eCLAIMS` | [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.9 | [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) | Use Java, or the [local patch](#the-eclaims-dtd-and-libxml2) with libxml2 tools ([KI-43](/known-issues#ki-43)) |
| Electronic Statement of Account (eSOA) | `eSOA` | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5 | [`esoa-sample.xml`](/examples/esoa-sample.xml) | v0.5 added `Others` ([KI-04](/known-issues#ki-04)) |
| Claim Form 5 (CF5), data for Diagnosis-Related Groups (DRG) | `CF5` | [`CF5.dtd`](/originals/cf5/CF5.dtd) (20240604) | [`cf5-sample.xml`](/examples/cf5-sample.xml) | The Guide prints a different v1.3 DTD ([KI-06](/known-issues#ki-06)) |
| Claim Form 4 (CF4) | `EPCB` | [`CF4.dtd`](/originals/cf4/CF4.dtd) (EPCB 1.20) | [`cf4-sample.xml`](/examples/cf4-sample.xml) | No PhilHealth validator method exists for CF4 ([KI-55](/known-issues#ki-55)) |
| Data migration | `eCLAIMS` | [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) | [`migration-sample.xml`](/examples/migration-sample.xml) | Same root as the upload XML, different DTD; same problem and same patch as eClaims ([KI-43](/known-issues#ki-43)) |

Two files have the root `eCLAIMS`. A migration file validated against `eClaimsDef.dtd` fails (it has `OFFLINEDOCUMENTS` instead of `DOCUMENTS`), and the reverse also fails. Pick the DTD by purpose, not by root element.

## What a DTD checks

An XML file can fail in two different ways:

- **Not well-formed.** It isn't XML at all: a missing quote, an unclosed tag. No parser can read it. The Guide's own eClaims sample has this problem: `pHospitalEmail=email@yahoo.com` has no quotes ([Guide p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29), [KI-28](/known-issues#ki-28)).
- **Not valid.** It is XML, but it doesn't follow the DTD.

A DTD checks:

- which elements exist, how they nest, in which order, and how often (`?` optional, `*` zero or more, `+` one or more);
- that every `#REQUIRED` attribute is present, and no undeclared attribute is used;
- that attributes with a list of values, such as `pPatientType (I|O)`, use one of them.

It does **not** check lengths, formats, conditional rules or codes. See [What DTD validation cannot catch](#what-dtd-validation-cannot-catch).

Why bother locally? PhilHealth checks the DTD too: uploadeClaims "ensures Document Type Definition (DTD) compliance" ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)), and validateeSOA and validateCF5 validate "against the Document Type Definition (DTD)" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). A local check finds the same structural errors in milliseconds, without a token, without encryption, and without using up an upload.

## The eClaims DTD and libxml2

::: danger Most command-line tools can't check eClaimsDef.dtd as published (KI-43)
`eClaimsDef.dtd` (and the migration DTD, which copies it) declares three elements with **non-deterministic content models**:

```xml
<!ELEMENT DISCHARGE ((ICDCODE+, RVSCODES*)|(ICDCODE*, RVSCODES+))>
<!ELEMENT PROCEDURES ((HEMODIALYSIS?, PERITONEAL?, LINAC?, COBALT?, TRANSFUSION?, BRACHYTHERAPHY?, CHEMOTHERAPY?, DEBRIDEMENT?, IMRT?), (HEMODIALYSIS|PERITONEAL|LINAC|COBALT|TRANSFUSION|BRACHYTHERAPHY|CHEMOTHERAPY|DEBRIDEMENT|IMRT))>
<!ELEMENT PARTICULARS ((DRGMED+|XLSO+), (DRGMED*|XLSO*))>
```

"Non-deterministic" means that when a parser reads, for example, the first `ICDCODE` inside `DISCHARGE`, it can't tell which of the two branches it is in without looking ahead. The XML 1.0 specification asks for deterministic content models "for compatibility". Tools built on the libxml2 library (xmllint, Python lxml, PHP's DOM extension, and many others) report these declarations as errors, and then behave differently depending on the libxml2 version. What we saw:

| Tool (version tested) | Result with the original `eClaimsDef.dtd` |
|---|---|
| xmllint, libxml2 2.9.14 (Ubuntu 24.04, Debian 12 and 13) | Prints `validity error : Content model of DISCHARGE is not determinist` but exits with code 0. It **skips** the content check of `DISCHARGE`, `PROCEDURES` and `PARTICULARS`: a file with an empty `DISCHARGE` passed. |
| xmllint, libxml2 2.13.9 (Alpine 3.23) | **Every** eClaims file fails (exit code 3), with no detail beyond "does not validate". |
| Python lxml 6.1.3 (bundles libxml2 2.14.6) | `validate()` returns `False` for **every** eClaims file. The only error is `DTD_CONTENT_NOT_DETERMINIST`. |
| PHP 8.3 `DOMDocument::validate()` (libxml2 2.9.14) | Returns `true` and logs the same "not determinist" message; an empty `DISCHARGE` passed. |
| Java 21 built-in parser (JAXP) | Validates correctly, including `DISCHARGE`. |

The DevKit's own method, NetBeans, runs on Java. We tested Java's built-in validating parser, not NetBeans itself.

The eSOA, CF5 and CF4 DTDs are not affected. The register tracks this problem as [KI-43](/known-issues#ki-43).
:::

You have two ways around it:

- **Use Java** with the original DTD. It checks every rule. See [Java](#java-recommended-for-eclaims-and-migration-xml) below.
- **Use a patched local copy of the DTD** with xmllint, lxml or PHP. This is the site's one patch script, for both `eClaimsDef.dtd` and `eClaimsXmlForDataMigration.dtd`.

**The patch script (our recommendation, not from PhilHealth).** Save it as `patch_dtd.py` in the folder where you downloaded [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) or [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd). It needs only Python 3.

```python
"""Make a local copy of eClaimsDef.dtd or eClaimsXmlForDataMigration.dtd
that libxml2-based tools (xmllint, Python lxml, PHP) can use.

Usage:  python patch_dtd.py <original.dtd> <patched.dtd>
Use the output ONLY for local testing. Never send it anywhere.
A file that passes the patched DTD also passes the original DTD.
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
dtd = open(src, encoding="utf-8", newline="").read()

# The nine repetitive procedures, in DTD order ("BRACHYTHERAPHY" is spelled
# this way in the DTD).
PROCS = ["HEMODIALYSIS", "PERITONEAL", "LINAC", "COBALT", "TRANSFUSION",
         "BRACHYTHERAPHY", "CHEMOTHERAPY", "DEBRIDEMENT", "IMRT"]
# At least one procedure, each at most once, in DTD order. STRICTER than the
# original, which also allows one extra procedure of any type at the end.
strict_procedures = "(" + " | ".join(
    "(" + ", ".join([p] + [q + "?" for q in PROCS[i + 1:]]) + ")"
    for i, p in enumerate(PROCS)) + ")"

fixes = {
    # Same set of valid documents, written deterministically.
    "<!ELEMENT DISCHARGE ((ICDCODE+, RVSCODES*)|(ICDCODE*, RVSCODES+))>":
        "<!ELEMENT DISCHARGE ((ICDCODE+, RVSCODES*) | RVSCODES+)>",
    # Same set of valid documents, written deterministically.
    "<!ELEMENT PARTICULARS ((DRGMED+|XLSO+), (DRGMED*|XLSO*))>":
        "<!ELEMENT PARTICULARS ((DRGMED+, XLSO*) | (XLSO+, DRGMED*))>",
    # Stricter, see above.
    "<!ELEMENT PROCEDURES ((HEMODIALYSIS?, PERITONEAL?, LINAC?, COBALT?, TRANSFUSION?, "
    "BRACHYTHERAPHY?, CHEMOTHERAPY?, DEBRIDEMENT?, IMRT?), (HEMODIALYSIS|PERITONEAL|LINAC|"
    "COBALT|TRANSFUSION|BRACHYTHERAPHY|CHEMOTHERAPY|DEBRIDEMENT|IMRT))>":
        "<!ELEMENT PROCEDURES " + strict_procedures + ">",
}
for old, new in fixes.items():
    if dtd.count(old) != 1:
        sys.exit(f"Declaration not found, is this the right DTD? {old[:45]}...")
    dtd = dtd.replace(old, new)

with open(dst, "w", encoding="utf-8", newline="") as out:
    out.write(dtd)
print(f"Wrote {dst}")
```

```bash
python patch_dtd.py eClaimsDef.dtd eClaimsDef.local.dtd
python patch_dtd.py eClaimsXmlForDataMigration.dtd eClaimsXmlForDataMigration.local.dtd
```

What the patch changes:

- **`DISCHARGE` and `PARTICULARS`** get deterministic models that accept exactly the same child sequences as the originals.
- **`PROCEDURES`** gets a **stricter** model: at least one procedure, each type at most once, in DTD order. The original also accepts a last procedure that repeats an earlier type or breaks the DTD order, for example two `HEMODIALYSIS` elements, or `PERITONEAL` then `HEMODIALYSIS`. The patched DTD rejects those.
- Nothing else changes. The script keeps the original line endings, so a diff shows only the three changed lines. It stops with an error if the file isn't one of the two DTDs.

So **a file that passes the patched DTD also passes the original DTD**. The reverse is not always true: the patched DTD may reject a valid file with repeated or out-of-order procedure elements. If a real claim fails only on `PROCEDURES`, check it with Java before you change it. Either way, this is only a local pre-check: [eClaimsFileCheck](/api/eclaims-file-check) has the final say.

How we tested it: we compared the original and patched models on every child sequence of up to 7 elements (`DISCHARGE`, `PARTICULARS`) and up to 5 elements (`PROCEDURES`). Then we checked copies of [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), changed as listed below, with Java 21 against the original DTD and with lxml 6.1.3 and xmllint 2.9.14 against the patched DTD:

| Test file | Java, original DTD | lxml and xmllint, patched DTD |
|---|---|---|
| `eclaims-minimal.xml` unchanged | valid | valid |
| An empty `DISCHARGE` | invalid | invalid |
| `RVSCODES` before `ICDCODE` in `DISCHARGE` | invalid | invalid |
| `PROCEDURES`: `HEMODIALYSIS`, `PERITONEAL` | valid | valid |
| `PROCEDURES`: `PERITONEAL`, `HEMODIALYSIS` | valid | **invalid** (stricter) |
| `PROCEDURES`: `HEMODIALYSIS` twice | valid | **invalid** (stricter) |
| `PROCEDURES`: `HEMODIALYSIS` three times | invalid | invalid |
| `PARTICULARS`: `DRGMED`, `DRGMED`, `XLSO` | valid | valid |
| `PARTICULARS`: `DRGMED`, `XLSO`, `DRGMED` | invalid | invalid |
| [`migration-sample.xml`](/examples/migration-sample.xml), migration DTD | valid | valid |

For eSOA, CF5 and CF4 you don't need a patch: their DTDs worked unchanged in all our tests.

## Option 1: NetBeans (the DevKit's method)

PhilHealth's one-page guide ([PDF](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf)) gives these steps for the eClaims XML:

1. Copy the eClaims XML file to a folder.
2. Copy `eClaimsDef.dtd` "(from the PECWSv3.0 dev kit)" to the same folder.
3. Launch NetBeans.
4. Click **File > Open** and select the eClaims XML file.
5. Insert these lines at the top of the file:

   ```xml
   <?xml version="1.0"?>
   <!DOCTYPE eCLAIMS PUBLIC "-//PHIC-ITMD//DTD eClaims File 1.0//EN" "eClaimsDef.dtd" >
   ```

6. Right-click on any whitespace in the XML text.
7. Click **Validate XML** in the context menu.
8. NetBeans shows the results in the window below the editor.

The `<!DOCTYPE ...>` line tells the validator the root element (`eCLAIMS`) and where the DTD is (`eClaimsDef.dtd`, in the same folder).

::: warning Replace the XML declaration; don't add a second one
If your file already starts with `<?xml ... ?>`, as this site's examples do, replace that line instead of inserting another above it. An XML declaration is only allowed as the very first thing in a file. With two, Java's parser stops with:

```text
line 3 (fatal): The processing instruction target matching "[xX][mM][lL]" is not allowed.
```
:::

The PDF covers only the eClaims XML. Recommendation (not from PhilHealth): for the other files, use these lines (the CF5 one is the example written in the comments of `CF5.dtd` itself). Each worked in our Java test with the matching DTD in the same folder. This site's `migration-sample.xml` already contains its `DOCTYPE` line; a file can have only one.

```xml
<!DOCTYPE eSOA SYSTEM "ESOA.dtd">
<!DOCTYPE CF5 SYSTEM "CF5.dtd">
<!DOCTYPE EPCB SYSTEM "CF4.dtd">
<!DOCTYPE eCLAIMS SYSTEM "eClaimsXmlForDataMigration.dtd">
```

Recommendation (not from PhilHealth): add the `DOCTYPE` only to a copy that you validate. The Guide's XML samples have no `DOCTYPE`, and the DevKit doesn't say whether PECWS accepts one ([KI-62](/known-issues#ki-62)). Encrypt and send the file without it.

## Option 2: The command line

The command line is what you want in automated tests and in continuous integration (CI). All outputs below are real, from our test runs on this site's example files and on deliberately broken copies of them.

**Get the files.** Download the DTD and the XML you want to check into one folder, then run the commands from that folder:

- DTDs: [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd), [`ESOA.dtd`](/originals/esoa/ESOA.dtd), [`CF5.dtd`](/originals/cf5/CF5.dtd), [`CF4.dtd`](/originals/cf4/CF4.dtd), [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd)
- Examples: [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), [`esoa-sample.xml`](/examples/esoa-sample.xml), [`cf5-sample.xml`](/examples/cf5-sample.xml), [`cf4-sample.xml`](/examples/cf4-sample.xml), [`migration-sample.xml`](/examples/migration-sample.xml), and PhilHealth's CF5 sample [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml)
- For eClaims and migration files with xmllint or lxml: the `.local.dtd` copies made by [`patch_dtd.py`](#the-eclaims-dtd-and-libxml2)

The broken copies in the outputs (`eclaims-broken.xml`, `eclaims-empty-discharge.xml`, `eclaims-unquoted.xml`, `esoa-v04-style.xml`) are our own test files; each output says what we changed.

### Java (recommended for eClaims and migration XML)

Java's built-in validating parser (JAXP) handles the non-deterministic content models correctly. So it validates the **original** `eClaimsDef.dtd` and migration DTD without a patch, and checks every rule in them ([KI-43](/known-issues#ki-43)). It works for the eSOA, CF5 and CF4 DTDs too.

It validates each file against the `DOCTYPE` line inside the file. So first add the `DOCTYPE` line to a copy of your file, as in the NetBeans steps (Option 1). Then save this as `ValidateXml.java`:

```java
import java.io.File;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

// Validates each file against the DTD named in its own <!DOCTYPE ...> line.
// Run with: java ValidateXml.java file1.xml [file2.xml ...]   (Java 11+)
// Exit code: 0 = all files valid, 1 = at least one file is not.
public class ValidateXml {
  public static void main(String[] files) throws Exception {
    int invalidFiles = 0;
    for (String f : files) {
      SAXParserFactory factory = SAXParserFactory.newInstance();
      factory.setValidating(true);
      int[] errors = {0};
      try {
        factory.newSAXParser().parse(new File(f), new DefaultHandler() {
          @Override public void error(SAXParseException e) {
            errors[0]++;
            System.out.println("  line " + e.getLineNumber() + ": " + e.getMessage());
          }
        });
      } catch (SAXParseException e) {
        errors[0]++;
        System.out.println("  line " + e.getLineNumber() + " (fatal): " + e.getMessage());
      }
      System.out.println((errors[0] == 0 ? "VALID: " : "INVALID: ") + f);
      if (errors[0] > 0) invalidFiles++;
    }
    System.exit(invalidFiles == 0 ? 0 : 1);
  }
}
```

Run it with Java 11 or later, which runs a single source file directly:

```bash
java ValidateXml.java nb-ok.xml nb-empty-discharge.xml migration-sample.xml eclaims-minimal.xml
```

No Java installed? The same command works in Docker: `docker run --rm -v "$PWD":/w -w /w eclipse-temurin:21-jdk java ValidateXml.java ...`

Output with Java 21. `nb-ok.xml` is `eclaims-minimal.xml` with its first line replaced by the two NetBeans lines, next to the original, unpatched `eClaimsDef.dtd`. `nb-empty-discharge.xml` is the same, but with an empty `DISCHARGE`. `migration-sample.xml` already has its `DOCTYPE`. The last file has no `DOCTYPE`, which is why it fails:

```text
$ java ValidateXml.java nb-ok.xml nb-empty-discharge.xml migration-sample.xml eclaims-minimal.xml
VALID: nb-ok.xml
  line 74: The content of element type "DISCHARGE" is incomplete, it must match "((ICDCODE+,RVSCODES*)|(ICDCODE*,RVSCODES+))".
INVALID: nb-empty-discharge.xml
VALID: migration-sample.xml
  line 23: Document root element "eCLAIMS", must match DOCTYPE root "null".
  line 23: Document is invalid: no grammar found.
INVALID: eclaims-minimal.xml
$ echo $?
1
```

"no grammar found" means the file has no `DOCTYPE`: add one to your copy and run again.

### xmllint

xmllint comes with libxml2. For eClaims and migration files, use the [patched `.local.dtd`](#the-eclaims-dtd-and-libxml2).

- Debian and Ubuntu: `sudo apt-get install libxml2-utils`
- macOS: xmllint is usually already installed. Check `xmllint --version`, because behavior depends on the libxml2 version (see the table above).
- Anywhere with Docker (no install; tested with `ubuntu:24.04`, libxml2 2.9.14):

  ```bash
  docker run --rm -v "$PWD":/w -w /w ubuntu:24.04 bash -c \
    'apt-get update -qq >/dev/null && apt-get install -y -qq libxml2-utils >/dev/null 2>&1 &&
     xmllint --noout --dtdvalid eClaimsDef.local.dtd eclaims-broken.xml; echo "exit code: $?"'
  ```

::: tip Prefer a Debian or Ubuntu image over Alpine
With `alpine` (libxml2 2.13.9), `--dtdvalid` printed only `Document eclaims-broken.xml does not validate against eClaimsDef.local.dtd`, without saying what was wrong. The Ubuntu and Debian builds print every error with its line number.
:::

The command is always the same:

```bash
xmllint --noout --dtdvalid <file.dtd> <file.xml>
```

`--noout` stops xmllint from printing the whole document back. `--dtdvalid` names the DTD, so your file doesn't need a `DOCTYPE`. In our runs with libxml2 2.9.14, the exit code was `0` for a valid file, `3` for a file that doesn't match the DTD, and `1` for a file that isn't well-formed. With libxml2 2.13.9 (Alpine), the file that isn't well-formed returned `4` instead of `1`, so in scripts treat any non-zero exit code as a failure.

#### eClaims XML

```bash
$ xmllint --noout --dtdvalid eClaimsDef.local.dtd eclaims-minimal.xml
$ echo $?
0
```

No output and exit code 0: the file is valid. Now a broken copy, where we removed `pTrackingNumber`, set `pPatientType="X"` and deleted the `DOCUMENTS` block:

```bash
$ xmllint --noout --dtdvalid eClaimsDef.local.dtd eclaims-broken.xml
eclaims-broken.xml:31: element CLAIM: validity error : Element CLAIM content does not follow the DTD, expecting (CF1 , CF2 , (ALLCASERATE | ZBENEFIT) , CF3? , PARTICULARS? , RECEIPTS? , DOCUMENTS), got (CF1 CF2 ALLCASERATE )
eclaims-broken.xml:31: element CLAIM: validity error : Element CLAIM does not carry attribute pTrackingNumber
eclaims-broken.xml:31: element CLAIM: validity error : Value "X" for attribute pPatientType of CLAIM is not among the enumerated set
Document eclaims-broken.xml does not validate against eClaimsDef.local.dtd
$ echo $?
3
```

Why the patch matters: here is a copy whose only `DISCHARGE` has no `ICDCODE` or `RVSCODES`, which the DTD forbids. With the original DTD, xmllint 2.9.14 reports only the determinism message and exits with 0:

```bash
$ xmllint --noout --dtdvalid eClaimsDef.dtd eclaims-empty-discharge.xml
validity error : Content model of DISCHARGE is not determinist: ((ICDCODE+ , RVSCODES*) | (ICDCODE* , RVSCODES+))
$ echo $?
0
$ xmllint --noout --dtdvalid eClaimsDef.local.dtd eclaims-empty-discharge.xml
eclaims-empty-discharge.xml:72: element DISCHARGE: validity error : Element DISCHARGE content does not follow the DTD, expecting ((ICDCODE+ , RVSCODES*) | RVSCODES+), got ()
Document eclaims-empty-discharge.xml does not validate against eClaimsDef.local.dtd
$ echo $?
3
```

And a file that isn't well-formed (the unquoted email from the Guide's sample), exit code 1:

```bash
$ xmllint --noout --dtdvalid eClaimsDef.local.dtd eclaims-unquoted.xml
eclaims-unquoted.xml:22: parser error : AttValue: " or ' expected
    pHospitalEmail=eclaims@samplehospital.example
                   ^
eclaims-unquoted.xml:22: parser error : attributes construct error
    pHospitalEmail=eclaims@samplehospital.example
                   ^
eclaims-unquoted.xml:22: parser error : Couldn't find end of Start Tag eCLAIMS line 18
    pHospitalEmail=eclaims@samplehospital.example
                   ^
eclaims-unquoted.xml:22: parser error : Extra content at the end of the document
    pHospitalEmail=eclaims@samplehospital.example
                   ^
$ echo $?
1
```

#### eSOA

```bash
$ xmllint --noout --dtdvalid ESOA.dtd esoa-sample.xml
$ echo $?
0
```

A file written for the older ESOA.dtd 0.4 (no `Others` category) that also uses the pre-0.4 attribute name `pActualCharges` ([KI-04](/known-issues#ki-04)):

```bash
$ xmllint --noout --dtdvalid ESOA.dtd esoa-v04-style.xml
esoa-v04-style.xml:3: element SummaryOfFees: validity error : Element SummaryOfFees content does not follow the DTD, expecting (RoomAndBoard , DrugsAndMedicine , LaboratoryAndDiagnostic , OperatingRoomFees , MedicalSupplies , Others , PhilHealth , Balance), got (RoomAndBoard DrugsAndMedicine LaboratoryAndDiagnostic OperatingRoomFees MedicalSupplies PhilHealth Balance )
esoa-v04-style.xml:6: element SummaryOfFee: validity error : Element SummaryOfFee does not carry attribute pChargesNetOfApplicableVat
esoa-v04-style.xml:6: element SummaryOfFee: validity error : No declaration for attribute pActualCharges of element SummaryOfFee
Document esoa-v04-style.xml does not validate against ESOA.dtd
$ echo $?
3
```

#### CF5

```bash
$ xmllint --noout --dtdvalid CF5.dtd cf5-sample.xml
$ echo $?
0
```

The example is a medical case with no secondary diagnosis and no procedure, so both containers are empty. The same file fails against the CF5 DTD v1.3 printed in the Guide (p. 17; we typed it into `CF5-guide-v1.3.dtd`), which requires exactly one `SECONDARYDIAG` and at least one `PROCEDURE` ([KI-06](/known-issues#ki-06)):

```bash
$ xmllint --noout --dtdvalid CF5-guide-v1.3.dtd cf5-sample.xml
cf5-sample.xml:25: element SECONDARYDIAGS: validity error : Element SECONDARYDIAGS content does not follow the DTD, expecting (SECONDARYDIAG), got
cf5-sample.xml:26: element PROCEDURES: validity error : Element PROCEDURES content does not follow the DTD, expecting (PROCEDURE)+, got
Document cf5-sample.xml does not validate against CF5-guide-v1.3.dtd
$ echo $?
3
```

We recommend the standalone `CF5.dtd`: it is newer, it matches the "up to 12" secondary diagnoses and "up to 20" procedures rules, and it accepts a claim with none of either. [validateCF5](/api/validate-cf5) has the final word, so send a claim like this one through it early.

#### CF4

```bash
$ xmllint --noout --dtdvalid CF4.dtd cf4-sample.xml
$ echo $?
0
```

#### Data migration

```bash
$ python patch_dtd.py eClaimsXmlForDataMigration.dtd eClaimsXmlForDataMigration.local.dtd
Wrote eClaimsXmlForDataMigration.local.dtd
$ xmllint --noout --dtdvalid eClaimsXmlForDataMigration.local.dtd migration-sample.xml
$ echo $?
0
```

`migration-sample.xml` contains a `DOCTYPE` line that names `eClaimsXmlForDataMigration.dtd`. If that file isn't in the same folder, xmllint also prints `warning: failed to load external entity "eClaimsXmlForDataMigration.dtd"`. With `--dtdvalid`, it still validates against the DTD you name.

### Python (lxml)

lxml wraps libxml2, so for eClaims and migration files use the [patched `.local.dtd`](#the-eclaims-dtd-and-libxml2). Install it with `pip install lxml` (we tested lxml 6.1.3). Save this as `validate_xml.py`:

```python
"""Validate one XML file against one DTD with lxml.

Usage:  python validate_xml.py <file.dtd> <file.xml>
Exit code: 0 = valid, 1 = not valid, 2 = not well-formed XML.
"""
import sys
from lxml import etree

dtd_path, xml_path = sys.argv[1], sys.argv[2]

try:
    # no_network=True: never download anything referenced by the file
    doc = etree.parse(xml_path, etree.XMLParser(no_network=True))
except etree.XMLSyntaxError as err:
    print(f"NOT WELL-FORMED: {err}")
    sys.exit(2)

dtd = etree.DTD(dtd_path)  # load a fresh DTD object for every file
if dtd.validate(doc):
    print(f"VALID: {xml_path}")
    sys.exit(0)

print(f"INVALID: {xml_path}")
for err in dtd.error_log.filter_from_errors():
    print(f"  line {err.line}: {err.message}")
    if err.type_name == "DTD_CONTENT_NOT_DETERMINIST":
        print("  hint: this DTD needs the deterministic patch (see the guide)")
sys.exit(1)
```

Output from our runs:

```bash
$ python validate_xml.py eClaimsDef.dtd eclaims-minimal.xml
INVALID: eclaims-minimal.xml
  line -1: Content model of DISCHARGE is not deterministic: ((ICDCODE+ , RVSCODES*) | (ICDCODE* , RVSCODES+))
  hint: this DTD needs the deterministic patch (see the guide)
$ python validate_xml.py eClaimsDef.local.dtd eclaims-minimal.xml
VALID: eclaims-minimal.xml
$ python validate_xml.py eClaimsDef.local.dtd eclaims-broken.xml
INVALID: eclaims-broken.xml
  line 31: Element CLAIM content does not follow the DTD, expecting (CF1 , CF2 , (ALLCASERATE | ZBENEFIT) , CF3? , PARTICULARS? , RECEIPTS? , DOCUMENTS), got (CF1 CF2 ALLCASERATE )
  line 31: Element CLAIM does not carry attribute pTrackingNumber
  line 31: Value "X" for attribute pPatientType of CLAIM is not among the enumerated set
$ python validate_xml.py ESOA.dtd esoa-sample.xml
VALID: esoa-sample.xml
$ python validate_xml.py CF5.dtd cf5-sample.xml
VALID: cf5-sample.xml
$ python validate_xml.py CF4.dtd cf4-sample.xml
VALID: cf4-sample.xml
$ python validate_xml.py eClaimsXmlForDataMigration.local.dtd migration-sample.xml
VALID: migration-sample.xml
$ python validate_xml.py eClaimsDef.local.dtd eclaims-unquoted.xml
NOT WELL-FORMED: AttValue: " or ' expected, line 22, column 20 (eclaims-unquoted.xml, line 22)
```

Why a fresh `etree.DTD` per file: with the unpatched eClaims DTD, lxml reported the determinism error only on the first validation. When we reused the same DTD object, the next validation returned `False` with an empty error log.

## Option 3: PhilHealth's validator methods

PhilHealth's own validators apply the DTD and more ("the required data format and valid values set by PhilHealth"). They need a token and your cipher key, so they come after local checks.

| Method | What it validates | What you send | What comes back |
|---|---|---|---|
| [validateeSOA](/api/validate-esoa) | The eSOA "against the Document Type Definition (DTD), ensuring compliance with the required data format and valid values set by PhilHealth" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)) | The eSOA XML, encrypted with your cipher key | Encrypted; decrypted it "may contains" `{"errors": [...]}` ([p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)); the success shape is not documented ([KI-42](/known-issues#ki-42)) |
| [validateCF5](/api/validate-cf5) | The CF5 "against the Document Type Definition (DTD), ensuring compliance with the required data format and values set by PhilHealth" ([p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) | `{"cf5": <envelope>, "eclaims": <envelope>}` | Not documented ([KI-42](/known-issues#ki-42)); see [DRG error codes](/reference/drg-error-codes) |
| [eClaimsFileCheck](/api/eclaims-file-check) | "the eClaims XML File" ([p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)) | The eClaims XML, encrypted with your cipher key | Encrypted; content not documented ([KI-42](/known-issues#ki-42)) |

There is no validator method for CF4 or for migration files ([KI-55](/known-issues#ki-55)). For those, the DTD check and your own rule checks are all you have.

The Guide tells you to attach the eSOA and CF5 only "after successful validation" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)), and certification checks that your system shows "warning errors and major errors" and the validation result for both ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)). The DevKit doesn't say whether a test environment or test credentials exist for calling these before certification. Ask PhilHealth.

Recommendation (not from PhilHealth): run validateeSOA and validateCF5 before you encrypt and host the attachments. Run eClaimsFileCheck last, on the exact eClaims XML you will upload, once its attachment URLs are live. [Submitting a claim](/guides/submitting-a-claim) shows the whole order.

## What DTD validation cannot catch

Almost every attribute in these DTDs is `CDATA #REQUIRED`. That means the attribute must be present, but its value can be any text, including an empty string. So a DTD-valid file can still be wrong in many ways:

| Kind of rule | Example | Source of the rule |
|---|---|---|
| **Lengths** | `pMemberPIN` is String(12); `RvsCode` is Varchar(6). The DTD accepts any length. | Annex C [p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79); Annex E [p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88) |
| **Formats** | Dates `MM-DD-YYYY` in eClaims and eSOA, times `HH:MM:SSAM/PM` in eClaims, but dates `YYYY-MM-DD` in CF4 ([KI-08](/known-issues#ki-08), [KI-49](/known-issues#ki-49)); amounts `#######.##`; `pTrackingNumber` `####-####-####-####`. `2026-09-15` in an eClaims date passes the DTD. | Annex C p. 79–85; Annex D p. 86–87; CF4 data dictionary |
| **Values of free-text attributes** | CF5 `Laterality` must be `L`, `R`, `B` or `N`, and `Ext1`/`Ext2` 1–9, but the DTD types them as `CDATA` ([KI-05](/known-issues#ki-05)) | Annex E p. 88 |
| **Conditional rules** | `pExpiredDate` and `pExpiredTime` are "Required when pDisposition = 'E'"; `pReferralIHCPAccreCode` when `pDisposition` = `T`; `pDoctorCoPay` when `pWithCoPay` = `Y`. The DTD makes them always present but lets them be empty. | Annex C [p. 80–81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| **Counts and duplicates** | CF5: one primary diagnosis, up to 12 secondary, up to 20 procedures, "no repeated codes across all the secondary diagnosis and with the primary diagnosis". The CF5 DTD allows any number. | [SSVTF p. 7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7); CF5 form; Annex E |
| **Code libraries** | ICD-10 and RVS codes, eSOA item and drug codes (30-character drug codes), CF4 library codes with active status. The DRG manuals that list valid ICD-10 and RVS codes are not in the DevKit ([KI-63](/known-issues#ki-63)). | Annex D–F; [eSOA libraries](/reference/libraries/esoa); [CF4 libraries](/reference/libraries/cf4) |
| **Check digits** | "The last character in the PIN is a modulus 11 check digit"; the algorithm is not given ([KI-64](/known-issues#ki-64)) | Annex C p. 79 |
| **Cross-document consistency** | CF5 `ClaimNumber` and `pHospitalCode` must match the eClaims XML (DRG error codes 222 and 509; Annex E describes `ClaimNumber` differently, [KI-45](/known-issues#ki-45)); `pTotalClaims` should equal the number of `CLAIM` elements | [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx); Annex C |
| **Arithmetic** | eSOA `pTotalAmount` = `pQuantity` × `pUnitPrice` | Annex D [p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87) |
| **Attachments** | The URL is HTTPS and reachable; the file decrypts; the content matches the raw file ([KI-57](/known-issues#ki-57)) | Annex C p. 85; [SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12) |

### Example: PhilHealth's own CF5 sample

The DevKit's [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml) is DTD-valid:

```bash
$ xmllint --noout --dtdvalid CF5.dtd "DRG XML EFORMS FORMAT.xml"
$ echo $?
0
```

But it breaks several rules that no DTD can express. Here is a short rule checker for CF5 (our code, based on Annex E, the CF5 form and the SSVTF). Save it as `cf5_rules.py`; it needs lxml.

```python
"""Checks a few CF5 rules that the DTD cannot express (Annex E, CF5 form, SSVTF).
Not a replacement for validateCF5 or for the ICD-10/RVS libraries.
Usage: python cf5_rules.py <cf5.xml>
"""
import re, sys
from lxml import etree

root = etree.parse(sys.argv[1]).getroot()
claim = root.find("DRGCLAIM")
problems = []

if not re.fullmatch(r"\d{6}|[A-Z]\d{5}", root.get("pHospitalCode", "")):
    problems.append("pHospitalCode: expected 6 characters, format 999999 or X99999")

primary = claim.get("PrimaryCode", "")
secondary = [s.get("SecondaryCode", "") for s in claim.iter("SECONDARYDIAG")]
if not primary:
    problems.append("PrimaryCode: exactly one primary diagnosis is required")
if len(secondary) > 12:
    problems.append(f"{len(secondary)} secondary diagnoses: the maximum is 12")
if len(set(secondary + [primary])) < len(secondary) + 1:
    problems.append("repeated ICD-10 code across primary and secondary diagnoses")

procedures = list(claim.iter("PROCEDURE"))
if len(procedures) > 20:
    problems.append(f"{len(procedures)} procedures: the maximum is 20")
rvs = [p.get("RvsCode", "") for p in procedures]
for dup in sorted({c for c in rvs if rvs.count(c) > 1}):
    problems.append(f"RvsCode {dup} appears more than once")
for p in procedures:
    code = p.get("RvsCode", "")
    if len(code) > 6:
        problems.append(f"RvsCode {code!r}: longer than Varchar(6)")
    if p.get("Laterality") not in ("L", "R", "B", "N"):
        problems.append(f"RvsCode {code!r}: Laterality {p.get('Laterality')!r} is not L, R, B or N")
    for ext in ("Ext1", "Ext2"):
        if p.get(ext) and not re.fullmatch(r"[1-9]", p.get(ext)):
            problems.append(f"RvsCode {code!r}: {ext} {p.get(ext)!r} is not 1-9")

weight = claim.get("NewBornAdmWeight", "")
# Annex E says "greater than 0.3 kg"; the CF5 form and DRG codes 228/418 accept
# exactly 0.3 (KI-51). This checker accepts 0.3 and above (our recommendation).
if weight and not (re.fullmatch(r"\d{1,2}(\.\d)?", weight) and float(weight) >= 0.3):
    problems.append(f"NewBornAdmWeight {weight!r}: kg, max 1 decimal, 0.3 or more")

print("\n".join(problems) or "no rule violations found")
sys.exit(1 if problems else 0)
```

```bash
$ python cf5_rules.py "DRG XML EFORMS FORMAT.xml"
RvsCode 93631 appears more than once
RvsCode '219ss20': longer than Varchar(6)
RvsCode '219ss20': Laterality '' is not L, R, B or N
RvsCode '69000': Laterality '' is not L, R, B or N
RvsCode '41108': Laterality '' is not L, R, B or N
RvsCode '93631': Laterality '' is not L, R, B or N
RvsCode '93631': Laterality '' is not L, R, B or N
$ python cf5_rules.py cf5-sample.xml
no rule violations found
```

::: warning The official DRG sample has invalid values
In PhilHealth's `DRG XML EFORMS FORMAT.xml` (also printed on p. 4 of the [20240604 CF5 PDF](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=4)), `RvsCode="219ss20"` has 7 characters, including letters, while Annex E defines `RvsCode` as Varchar(6), "Valid RVS code". RVS code `93631` appears twice; the DRG workbook's warning code 507 is "Procedure code has duplicate". Both are in [KI-28](/known-issues#ki-28). The blank `Laterality` values are [KI-05](/known-issues#ki-05), and the `ClaimNumber="2601"` is covered by [KI-31](/known-issues#ki-31) (length) and [KI-45](/known-issues#ki-45) (what the number should be). Use the sample to learn the structure only.
:::

One of these rules differs between sources. Annex E says the newborn admission weight "Should be greater than 0.3 kg" ([p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). The CF5 form says "Admission weight less than 0.3kg is considered invalid", and DRG error codes 228 and 418 say the weight "must not be lower than 0.3 kg" and "must be 0.3 kg and up". So a weight of exactly 0.3 kg is invalid under Annex E but valid under the other two ([KI-51](/known-issues#ki-51)). The checker follows the site's recommendation from KI-51 (not from PhilHealth): accept 0.3 kg and above, with one decimal place, and let validateCF5 confirm.

The checker lets blank `Ext1` and `Ext2` values pass, as in both official CF5 samples. Annex E lists only `1`–`9`, and the DevKit doesn't say whether blanks are accepted when no extension applies ([KI-63](/known-issues#ki-63)).

The checker is deliberately small: it doesn't know which codes exist. Only PhilHealth's libraries and validators can tell you that. Recommendation (not from PhilHealth): put checks like these in your XML builder, and run them together with the DTD check in your automated tests.

## Common mistakes

1. **Trusting exit code 0 from xmllint with the original eClaims DTD.** libxml2 2.9 skips the `DISCHARGE`, `PROCEDURES` and `PARTICULARS` checks. Use Java, or the patched local copy ([KI-43](/known-issues#ki-43)).
2. **Using the wrong DTD version.** ESOA.dtd 0.4 files lack `Others`; the Guide's CF5 DTD v1.3 differs from `CF5.dtd` ([KI-04](/known-issues#ki-04), [KI-06](/known-issues#ki-06)).
3. **Validating a migration file against `eClaimsDef.dtd`,** or the reverse. Same root, different DTDs.
4. **Adding a second XML declaration** when inserting the NetBeans `DOCTYPE` lines.
5. **Sending the `DOCTYPE` or the patched DTD to PhilHealth.** Both are for local testing only.
6. **Treating "DTD-valid" as "correct".** Lengths, formats, codes and conditional rules still need checking, locally and with PhilHealth's validators.
7. **Validating one file but uploading another.** Validate the exact bytes you will encrypt. validateCF5 takes the eClaims XML too, so send the same eClaims XML that you will upload. The DevKit doesn't say whether that XML must already contain the final attachment URLs ([KI-62](/known-issues#ki-62)), so run eClaimsFileCheck again on the final file.
8. **Copying PhilHealth's samples as templates.** Several are not well-formed or contain invalid values ([KI-28](/known-issues#ki-28)). Start from this site's DTD-valid examples.

## Related pages

- [eClaims XML reference](/reference/eclaims-xml), [eSOA XML](/reference/esoa-xml), [CF5 XML](/reference/cf5-xml), [CF4 XML](/reference/cf4-xml), [Migration XML](/reference/migration-xml)
- [validateeSOA](/api/validate-esoa), [validateCF5](/api/validate-cf5), [eClaimsFileCheck](/api/eclaims-file-check)
- [DRG error codes](/reference/drg-error-codes)
- [Submitting a claim](/guides/submitting-a-claim)
- [Known issues](/known-issues)
