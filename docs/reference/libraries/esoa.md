---
title: eSOA libraries (Annex F)
description: The Annex F code lists behind eSOA item codes, names and categories (Item, Category, Sub-Category, Bill Type and Medicine libraries), with counts, the 30-character drug code structure, comparisons and loading tips.
---

# eSOA libraries (Annex F)

<Badge type="tip" text="Current" /> <Badge type="warning" text="Data quality" />

Annex F of the Implementation Guide holds the code lists you need to fill in `ItemizedBillingItem@pItemCode`, `@pItemName` and `@pCategory` in the electronic Statement of Account (eSOA). The two big lists, the **Item Library** and the **Medicine Library**, also ship as spreadsheets. Copy your codes from them. This page describes each library, what we counted and verified in the files, how the 30-character drug code is built, and how to load the lists without corrupting the codes. The files have a few data-quality problems: two irregular drug codes and truncated, repeated descriptions ([KI-39](/known-issues#ki-39)).

::: info Sources
- [`Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx)
- [`Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx)
- [Implementation Guide (rev. 20250217), p. 89–130: Annex F, A. Item Library](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89)
- [Implementation Guide, p. 130: B. Category Library, C. Sub-Category Library, D. Bill Type Library](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130)
- [Implementation Guide, p. 131–188: E. Medicine Library](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=131)
- [Implementation Guide, p. 87: Annex D rules for `pItemCode`, `pItemName`, `pUnitOfMeasurement`, `pCategory`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87)
- [Implementation Guide, p. 3–4: revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- Claim Form 4 (CF4) medicine libraries, used for comparison: [`lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx), [`lib_medicine_generic.xlsx`](/originals/cf4/libraries/lib_medicine_generic.xlsx), [`lib_medicine_salt.xlsx`](/originals/cf4/libraries/lib_medicine_salt.xlsx), [`lib_medicine_strength.xlsx`](/originals/cf4/libraries/lib_medicine_strength.xlsx), [`lib_medicine_form.xlsx`](/originals/cf4/libraries/lib_medicine_form.xlsx), [`lib_medicine_unit.xlsx`](/originals/cf4/libraries/lib_medicine_unit.xlsx), [`lib_medicine_package.xlsx`](/originals/cf4/libraries/lib_medicine_package.xlsx)
:::

## Overview

| Library | Where | Size | Used for |
|---|---|---|---|
| [A. Item Library](#a-item-library) | [xlsx](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) and [Guide p. 89–130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89) | 1,898 items | `pItemCode`, `pItemName` (and `pCategory`) for supplies, laboratory, room and board, operating room |
| [B. Category Library](#b-category-library) | [Guide p. 130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130) only | 9 rows | `pCategory` values and the category element names |
| [C. Sub-Category Library](#c-sub-category-library) | Guide p. 130 only | 7 rows | Descriptive. Matches the seven `SummaryOfFee` amounts. |
| [D. Bill Type Library](#d-bill-type-library) | Guide p. 130 only | 2 rows | Descriptive (institution vs professional) |
| [E. Medicine Library](#e-medicine-library) | [xlsx](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) and [Guide p. 131–188](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=131) | 2,427 drugs | `pItemCode` (Drug Code) and `pItemName` for `DrugsAndMedicine` lines |

The table of contents (Guide p. 5) labels the item library entry "Annex E", but the page itself says "Annex F" ([KI-09](/known-issues#ki-09)).

How the libraries drive an itemized line (Annex D, [Guide p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87)):

| Line type | `pItemCode` | `pItemName` | `pUnitOfMeasurement` |
|---|---|---|---|
| In the Item Library | Library `pItemCode` | Library `pItemName` | The unit used |
| Drug in the Medicine Library | 30-character `Drug Code` | `Drug Description` | Blank |
| Not in any library | Blank | Complete description | The unit used (blank for drugs) |

## A. Item library

### Columns

The workbook has one data sheet, `ESOA_ITEM_LIB`, with the header row `pItemCode | pCategory | pItemName`. The column names match the XML attribute names.

| Column | Type in the xlsx | Example |
|---|---|---|
| `pItemCode` | Number (integer) | `1545` |
| `pCategory` | Text, one of the category values in the Document Type Definition (DTD), `ESOA.dtd` | `LaboratoryAndDiagnostic` |
| `pItemName` | Text, uppercase | `HEMATOLOGY: CBC` |

A second sheet, `SQL`, contains no data. It holds the database query used to export the list (`... FROM "UCPS"."ESOA_ITEM_LIB" ...`). That query mentions columns such as `STATUS`, `DATE_ACTIVATED` and `DATE_DEACTIVATED`, which are **not** in the export. Unlike the CF4 clinical libraries (for example `lib_chief_complaint.xlsx`, which has a `LIBRARY STATUS` column), the eSOA Item Library gives no active or inactive status. Neither medicine library has a status column either. Skip this sheet when you load the workbook.

### Counts (computed from the xlsx)

- **1,898 items**, codes `1` to `1898`. The codes are contiguous and unique, with no gaps, and sorted by code.
- No duplicate names. The longest name has 212 characters, within `pItemName` Varchar(300).
- All names are uppercase. 125 names contain a double quote (`"`), 64 an apostrophe (`'`) and 32 an ampersand (`&`). Your XML writer must escape these.

| `pCategory` | Items | Code range |
|---|---:|---|
| `MedicalSupplies` | 1,539 | `1`–`1539` |
| `LaboratoryAndDiagnostic` | 357 | `1540`–`1896` |
| `RoomAndBoard` | 1 | `1897` (`ROOM AND BOARD`) |
| `OperatingRoomFees` | 1 | `1898` (`OPERATING ROOM`) |
| `DrugsAndMedicine` | 0 | Use the Medicine Library |
| `Others` | 0 | Always an unlisted item (blank code) |
| **Total** | **1,898** | |

Laboratory items are named `SECTION: TEST`. The sections, by the text before the first colon:

| Section prefix | Items |
|---|---:|
| `PATHOLOGY` | 115 |
| `CHEMISTRY` | 108 |
| `MICROBIOLOGY` | 44 |
| `HEMATOLOGY` | 35 |
| `MICROSCOPY` | 32 |
| `LIQUID-BASED CYTOLOGY FOR GYNECOLOGICAL SAMPLES` | 17 |
| `ABG` | 3 |
| `PAP SMEAR, CONVENTIONAL` | 1 |
| `LIQUID-BASED CYTOLOGY FOR NON-GYNECOLOGICAL SAMPLES` | 1 |
| `BLOOD TYPING` | 1 |

A keyword search of the laboratory items found no imaging or cardiac procedures (X-ray, ultrasound, CT, MRI, ECG, 2D echo) and no dengue test. Words like "X-RAY" appear only in supply names, such as X-ray film envelopes. Bill those procedures as unlisted items: blank `pItemCode` and a complete `pItemName`.

### Examples

| `pItemCode` | `pCategory` | `pItemName` |
|---|---|---|
| `1` | `MedicalSupplies` | BATH SOAP |
| `117` | `MedicalSupplies` | SYRINGE DISP,5CC G. 23 X 1, LUER LOCK |
| `175` | `MedicalSupplies` | GLOVES STERILE, S-6.0 NON LATEX |
| `313` | `MedicalSupplies` | I.V. ADMINISTRATION SET, ADULT (MACROSET) |
| `352` | `MedicalSupplies` | IV CATHETER G. 20 |
| `1288` | `MedicalSupplies` | FACE MASK (EAR LOOP)DISPOSABLE |
| `1539` | `MedicalSupplies` | HEPARIN SODIUM |
| `1545` | `LaboratoryAndDiagnostic` | HEMATOLOGY: CBC |
| `1566` | `LaboratoryAndDiagnostic` | HEMATOLOGY: PLATELET COUNT |
| `1594` | `LaboratoryAndDiagnostic` | CHEMISTRY: CREATININE |
| `1704` | `LaboratoryAndDiagnostic` | MICROSCOPY: URINE-URINALYSIS |
| `1896` | `LaboratoryAndDiagnostic` | BLOOD TYPING: BLOOD TYPING |
| `1897` | `RoomAndBoard` | ROOM AND BOARD |
| `1898` | `OperatingRoomFees` | OPERATING ROOM |

The codes in the Guide's sample XML (`1545`, `1898`, `175`, `1288`) all exist in the library with the same names and categories. Our [sample eSOA](/reference/esoa-xml#sample) uses `117`, `313`, `352`, `1545`, `1566`, `1704` and `1897`.

Some item names look like drugs. For example, `1539` HEPARIN SODIUM is filed under `MedicalSupplies`. For library items, send the category the library gives, and ask PhilHealth if you are unsure.

### The Guide's printed list vs the xlsx

We extracted the printed Item Library from the Guide PDF (p. 89–130) and compared it with the xlsx. They match: the same **1,898 codes** in the same order, the same category for every code, and the same names (compared ignoring whitespace, because long names wrap across lines in the PDF). Either source gives the same data. The xlsx is easier to load.

## B. Category library

From [Guide p. 130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130), verbatim:

| `cat_id` | `cat_desc` | `billtype_id` |
|---|---|---|
| RoomAndBoard | ROOM AND BOARD | I |
| DrugsAndMedicine | DRUGS AND MEDICINE | I |
| LaboratoryAndDiagnostic | LABORATORY AND DIAGNOSTIC | I |
| OperatingRoomFees | OPERATING ROOM FEES | I |
| MedicalSupplies | MEDICAL SUPPLIES | I |
| Others | OTHERS | I |
| PAN: (FN MN LN Suffix) | PAN: (FN MN LN SUFFIX) | P |
| PhilHealth | PHILHEALTH | (blank) |
| Balance | BALANCE | (blank) |

How it maps to the XML (our reading; the Guide doesn't explain the table):

- The six rows with `billtype_id` `I` are exactly the six `pCategory` values in `ESOA.dtd` v0.5. They are also the names of the six category elements under `SummaryOfFees`. Only these six are valid in `pCategory`.
- "PAN: (FN MN LN Suffix)" looks like the row label for a professional fee: the physician's PhilHealth Accreditation Number (PAN) plus first, middle and last name and suffix, which is `ProfessionalInfo` in the XML. Its `billtype_id` is `P`.
- `PhilHealth` and `Balance` match the `PhilHealth` and `Balance` elements.

## C. Sub-category library

| `subcat_id` | `subcat_desc` | Matching `SummaryOfFee` attribute (by order and name) |
|---:|---|---|
| 1 | ACTUAL CHARGES | `pChargesNetOfApplicableVat` (formerly `pActualCharges`) |
| 2 | SENIOR CITIZEN DISCOUNT | `pSeniorCitizenDiscount` |
| 3 | PWD DISCOUNT | `pPWDDiscount` |
| 4 | PCSO DISCOUNT | `pPCSO` |
| 5 | DSWD DISCOUNT | `pDSWD` |
| 6 | DOH MEDICAL ASSISTANCE PROGRAM | `pDOHMAP` |
| 7 | HMO DISCOUNT | `pHMO` |

The first two columns are verbatim from [Guide p. 130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130). The third is our observation: the seven entries line up with the seven `SummaryOfFee` attributes. Entry 1 still uses the old name "ACTUAL CHARGES", from before DTD v0.4 renamed `pActualCharges` ([KI-04](/known-issues#ki-04)). No sub-category ID appears in the XML.

## D. Bill type library

| `billtype_id` | `billtype_desc` |
|---|---|
| I | HEALTH CARE INSTITUTION |
| P | HEALTH CARE PROFESSIONAL |

Verbatim from Guide p. 130. The eSOA XML has no bill-type attribute. The split corresponds to `SummaryOfFees` (institution) vs `ProfessionalFees` (professionals).

## E. Medicine library

Annex F calls it "Medicine Library (Drug and Medicine Category)". Annex D says: "For Drug and Medicine Category, use the Drug Code (30 characters) from the Medicine Library."

### Columns and counts

The workbook has one sheet, `lib_medicine`, with the header `Drug Code | Drug Description`. We counted:

- **2,427 drugs**, meaning 2,428 spreadsheet rows including the header. All codes are unique.
- **2,426 codes have 30 characters and one has 25**. Of the 30-character codes, one has two segments swapped, so 2,425 codes follow the usual pattern (see [Anomalies](#anomalies) and [KI-39](/known-issues#ki-39)).
- Codes use `A`–`Z`, `0`–`9` and `-` (for example `CO-AM0000000061POW2700000VIALX`). 32 codes start with a digit, for example `09SOD...` and `5D9SC...`.
- Descriptions use mixed case, for example `PARACETAMOL 500 mg TABLET`. Copy them exactly.
- The last row is `NOMED0000000000000000000000000`, "DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE".
- 701 distinct generic codes (the first 5 characters). The most common dosage forms are SOLUTION (932), TABLET (561), CAPSULE (148), SUSPENSION (102), CREAM (77), SYRUP (75) and POWDER (72).

The rows are neither sorted by code nor strictly by description. Don't rely on the order.

### How the 30-character Drug Code is built

The eSOA workbook has only the code and description. The CF4 [`lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx) has the same rows plus six component columns: `Gen Code`, `Salt Code`, `Form Code`, `Strength Code`, `Unit Code`, `Package Code`. Each component is 5 characters. We checked every row programmatically. **For 2,425 of the 2,427 rows**, the Drug Code is those components joined in this order:

```text
 Generic  Salt   Strength Form   Unit   Package
 [5]      [5]    [5]      [5]    [5]    [5]      = 30 characters
```

This is **not** the column order in the CF4 sheet, where Form comes before Strength. No PhilHealth document states this structure. We inferred it from the data, so treat it as an observation. Every component value also exists in the matching CF4 component library (`lib_medicine_generic.xlsx`, `..._salt`, `..._strength`, `..._form`, `..._unit`, `..._package`).

Decoded examples (component descriptions from the CF4 component libraries):

| Drug Code | Generic | Salt | Strength | Form | Unit | Package | Library description |
|---|---|---|---|---|---|---|---|
| `019610000000000SOL3200195AMPUL` | `01961` VITAMINS INTRAVENOUS, FAT-SOLUBLE | `00000` (none) | `00000` N/A | `SOL32` SOLUTION | `00195` 10 mL | `AMPUL` AMPULE | VITAMINS INTRAVENOUS, FAT-SOLUBLE SOLUTION 10 mL AMPULE |
| `PARAC0000000015SUPP40000000000` | `PARAC` PARACETAMOL | `00000` (none) | `00015` 250 mg | `SUPP4` SUPPOSITORY | `00000` (none) | `00000` N/A | PARACETAMOL 250 mg SUPPOSITORY |
| `ALEND0005300069TAB490000000000` | `ALEND` ALENDRONATE | `00053` SODIUM SALT | `00069` 10 mg | `TAB49` TABLET | `00000` (none) | `00000` N/A | ALENDRONATE ( as SODIUM SALT) 10 mg TABLET |
| `ZINCX0000001344SYRUP00201BOTTL` | `ZINCX` ZINC | `00000` (none) | `01344` 70 mg/5 mL (Equiv. 10 mg Elemental Zinc) | `SYRUP` SYRUP | `00201` 120 mL | `BOTTL` BOTTLE | ZINC 70 mg/5 mL (Equiv. 10 mg Elemental Zinc) SYRUP 120 mL BOTTLE |
| `NOMED0000000000000000000000000` | `NOMED` DRUGS AND MEDICINES NOT NEEDED ... | `00000` | `00000` | `00000` | `00000` | `00000` | DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE |

::: warning Look codes up; never build them
The generic segment is a code, not an abbreviation you can guess. Omeprazole's codes start with `ESOM1`, and losartan + hydrochlorothiazide uses `LOSA1`. Two rows also break the pattern (below). Always copy the Drug Code from the library row that matches the product.
:::

### Anomalies

::: warning Two drug codes don't follow the pattern
- **`LOSA100000014650000000000`** (LOSARTAN + HYDROCHLOROTHIAZIDE 100 mg + 12.5 mg TABLET) has **25 characters**, not 30. Its CF4 component columns are `LOSA1` / `00000` / `TAB49` / `01465` / `00000` / `00000`, but the code lacks the `TAB49` form segment. The same 25-character code is in the eSOA workbook, the CF4 workbook and the Guide ([p. 168](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=168)). Annex D describes drug codes as 30 characters. If your code validates length, allow this exception, or ask PhilHealth which form it expects.
- **`TOLNA00000CREA30008200227TUB01`** (TOLNAFTATE 0.10% CREAM 15 g TUBE, [p. 186](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=186)) is 30 characters, but the Form (`CREA3`) and Strength (`00082`) segments are swapped compared with every other row.

Both show why you should copy codes exactly and never rebuild them from components ([KI-39](/known-issues#ki-39)).
:::

::: warning Descriptions are cut at 100 characters and are not unique
36 descriptions are exactly 100 characters long, the maximum in the file, and some visibly stop mid-word. For example, one ends `... 70% isophane suspension + 30% soluble insuli`. Eight description strings are shared by two to six different codes. For example, six `AMIDOTRIZOATE (DIATRIZOATE) ...` codes (first on [p. 134](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=134)) share one truncated description, and differ only in unit and package. Key your data on the **Drug Code**, never on the description. Let users pick from code plus description ([KI-39](/known-issues#ki-39)).
:::

### Same list as the CF4 medicine library

The eSOA Medicine Library and the CF4 [`lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx) (sheet `tsekap_lib_medicine`) contain **identical** Drug Code + Drug Description pairs: all 2,427, in the same order (verified programmatically). The CF4 file adds the six component columns. The Guide's printed Medicine Library (p. 131–188) also matches the xlsx exactly: the same 2,427 codes in the same order, and the same descriptions (ignoring whitespace). So one medicine table in your database can serve both the eSOA and CF4. See [CF4 libraries](/reference/libraries/cf4).

### `NOMED` and the eSOA

`NOMED0000000000000000000000000` exists so that CF4 can say "no medicine was needed" (see the CF4 rules in [Building CF4](/guides/cf4)). Annex D does not mention it for the eSOA, and the DevKit doesn't say whether an eSOA without drug charges needs a `NOMED` line ([KI-53](/known-issues#ki-53)). `DrugsAndMedicine` still needs its `SummaryOfFee` (with `0.00` amounts) either way. Confirm with PhilHealth before you send a `NOMED` itemized line.

### Revision history

- 20240823: "Added eSOA Libraries". 20240911: "Added Medicine Library in the eSOA Library (Annex F)" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).
- 20250217: "Changed the Drug and Medicine Library for eSOA" ([Guide p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4), [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf)). The DevKit doesn't say what changed, and it contains no older copy to compare against.

## Tips for loading the libraries

1. **Keep every code as text.** Item codes are stored as numbers in the xlsx, so convert them to strings (`1545` → `"1545"`) and never pad them (`"01545"`) or add spaces (`" 1898"`, [KI-34](/known-issues#ki-34)). Drug codes are already text. Keep them as text in your database too, because some start with digits (`09SOD...`, `5D9SC...`). If anyone opens and re-saves the files in Excel, check that nothing was auto-converted. The CF4 strength and unit libraries already have Excel-converted values ([KI-39](/known-issues#ki-39)).
2. **Read only the data sheet**: `ESOA_ITEM_LIB` for items and `lib_medicine` for drugs. Skip the `SQL` sheet.
3. **Use exact names.** Send `pItemName` exactly as in the library: same case, punctuation and spacing (for example `FACE MASK (EAR LOOP)DISPOSABLE`, with no space before `DISPOSABLE`).
4. **Key on codes, not names.** Drug descriptions repeat and are truncated.
5. **Store the library version.** Record which DevKit revision you loaded (for example 20250217). PhilHealth has changed the Medicine Library before, and PC 2023-0026 V.BB says formats "may" be updated. Ask the UPECS-EMR team for the newest files.
6. **Map, don't guess, categories.** Map your hospital's chargemaster to library codes once, review the mapping, and use the library's `pCategory` for library items.

To try the code below, download [`Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) and [`Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) into the folder you run it from. Python needs `pip install openpyxl`; Node.js needs `npm install xlsx`.

::: code-group

```python [Python (openpyxl)]
import openpyxl

def load_items(path="Annex F - eSOA Item Library.xlsx"):
    ws = openpyxl.load_workbook(path, read_only=True)["ESOA_ITEM_LIB"]
    rows = ws.iter_rows(min_row=2, values_only=True)
    # pItemCode is numeric in the xlsx: convert to text without padding or spaces
    return {str(code).strip(): {"category": cat, "name": name}
            for code, cat, name in rows if code is not None}

def load_medicines(path="Annex F - Medicine Library.xlsx"):
    ws = openpyxl.load_workbook(path, read_only=True)["lib_medicine"]
    return {code: desc for code, desc in ws.iter_rows(min_row=2, values_only=True) if code}

items = load_items()
meds = load_medicines()
assert len(items) == 1898 and len(meds) == 2427
assert items["1545"]["name"] == "HEMATOLOGY: CBC"
assert meds["PARAC0000000015SUPP40000000000"] == "PARACETAMOL 250 mg SUPPOSITORY"
```

```js [Node.js (SheetJS xlsx)]
// npm install xlsx
const XLSX = require("xlsx");

function loadItems(path = "Annex F - eSOA Item Library.xlsx") {
  const ws = XLSX.readFile(path).Sheets["ESOA_ITEM_LIB"];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }); // keys from header row
  const items = new Map();
  for (const r of rows) {
    // pItemCode arrives as a number: store it as a string
    items.set(String(r.pItemCode).trim(), { category: r.pCategory, name: r.pItemName });
  }
  return items;
}

function loadMedicines(path = "Annex F - Medicine Library.xlsx") {
  const ws = XLSX.readFile(path).Sheets["lib_medicine"];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return new Map(rows.map((r) => [String(r["Drug Code"]), r["Drug Description"]]));
}

const items = loadItems();
const meds = loadMedicines();
console.log(items.size, meds.size); // 1898 2427
```

:::

Both snippets were run against the DevKit files: Python with openpyxl, and Node.js with `xlsx` 0.18.5 from npm. Each loaded 1,898 items and 2,427 drugs.

## Related pages

- [Building the eSOA](/guides/esoa): the rules for item codes and names in context
- [eSOA XML reference](/reference/esoa-xml): `ItemizedBillingItem` attributes
- [CF4 libraries](/reference/libraries/cf4): the same medicine list with component columns, and the component libraries
- [Known issues](/known-issues): [KI-04](/known-issues#ki-04), [KI-09](/known-issues#ki-09), [KI-34](/known-issues#ki-34), [KI-39](/known-issues#ki-39), [KI-53](/known-issues#ki-53)
