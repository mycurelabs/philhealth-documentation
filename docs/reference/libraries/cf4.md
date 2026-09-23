---
title: CF4 libraries
description: The 16 CF4 code-library spreadsheets, which XML attribute uses each one, how the 30-character drug code is built, the NOMED codes, and the data-quality traps in the files.
---

# CF4 libraries

<Badge type="tip" text="Current" /> <Badge type="warning" text="Data quality" />

The CF4 XML stores many answers as **codes** instead of text: physical-exam findings, signs and symptoms, and drugs. The codes come from 16 Excel spreadsheets in the DevKit's `CF4/LIBRARIES` folder. This page explains what each file contains, which XML attribute uses it, how the drug code is built, and which values in the files are broken, so you can load them safely.

::: info Sources
- [CF4 Data Dictionary rev. 4 (Annex G), TABLE REFERENCE column, p. 7–8, 10, 12–13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7)
- [CF4 files update (2021-02-23), p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1)
- Library files (all under `/originals/cf4/libraries/`): [`lib_abdomen.xlsx`](/originals/cf4/libraries/lib_abdomen.xlsx), [`lib_chest.xlsx`](/originals/cf4/libraries/lib_chest.xlsx), [`lib_chief_complaint.xlsx`](/originals/cf4/libraries/lib_chief_complaint.xlsx), [`lib_genitourinary.xlsx`](/originals/cf4/libraries/lib_genitourinary.xlsx), [`lib_heart.xlsx`](/originals/cf4/libraries/lib_heart.xlsx), [`lib_heent.xlsx`](/originals/cf4/libraries/lib_heent.xlsx), [`lib_icd.xlsx`](/originals/cf4/libraries/lib_icd.xlsx), [`lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx), [`lib_medicine_form.xlsx`](/originals/cf4/libraries/lib_medicine_form.xlsx), [`lib_medicine_generic.xlsx`](/originals/cf4/libraries/lib_medicine_generic.xlsx), [`lib_medicine_package.xlsx`](/originals/cf4/libraries/lib_medicine_package.xlsx), [`lib_medicine_salt.xlsx`](/originals/cf4/libraries/lib_medicine_salt.xlsx), [`lib_medicine_strength.xlsx`](/originals/cf4/libraries/lib_medicine_strength.xlsx), [`lib_medicine_unit.xlsx`](/originals/cf4/libraries/lib_medicine_unit.xlsx), [`lib_neuro.xlsx`](/originals/cf4/libraries/lib_neuro.xlsx), [`lib_skin.xlsx`](/originals/cf4/libraries/lib_skin.xlsx)
- [eSOA Medicine Library (Annex F)](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx), for comparison
:::

::: tip TL;DR
- Physical-exam findings (`PEMISC`) and signs and symptoms (`SUBJECTIVE@pSignsSymptoms`) are **IDs** from the libraries. Use only entries with LIBRARY STATUS `1`.
- Drugs use the 30-character **Drug Code** from `lib_medicine.xlsx`, plus its six component codes from the same row. Use the NOMED codes when no drug was given.
- `ICDS@pIcdCode` is always the default `000`; the real diagnosis goes in the eClaims XML.
- Load every file as **text**, and skip stray rows. The files have [data-quality problems](#data-quality) ([KI-39](/known-issues#ki-39)).
:::

::: details Abbreviations used on this page
| Term | Meaning |
|---|---|
| CF4 | Claim Form 4, the clinical record of a confinement |
| HEENT, CVS, GU (IE) | Head, eyes, ears, nose and throat; cardiovascular system; genitourinary (internal examination) |
| ICD | International Classification of Diseases (ICD-10 diagnosis codes) |
| eSOA | Electronic Statement of Account |
| SSVTF | Software Solution Validation Test Form (certification checklist) |
| NOMED | The library code for "no medicine given" |

More terms: [Glossary](/getting-started/glossary).
:::

## At a glance

"Rows" counts real data rows only (no header, legend, notes, or blank rows). The attribute mapping comes from the dictionary's TABLE REFERENCE column.

| File | Sheet | Columns | Rows | Status column | Used by | Dict. |
|---|---|---|---|---|---|---|
| [`lib_skin.xlsx`](/originals/cf4/libraries/lib_skin.xlsx) | `lib_skin` | SKIN ID, SKIN DESCRIPTION, LIBRARY STATUS | 11 (all active) | Yes | `PEMISC@pSkinId` | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| [`lib_heent.xlsx`](/originals/cf4/libraries/lib_heent.xlsx) | `tsekap_lib_heent` | HEENT ID, HEENT DESCRIPTION, LIBRARY STATUS | 19 (9 active, 10 deactivated) | Yes | `PEMISC@pHeentId` | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| [`lib_chest.xlsx`](/originals/cf4/libraries/lib_chest.xlsx) | `lib_chest` | CHEST ID, CHEST DESCRIPTION, LIBRARY STATUS | 11 (8 active, 3 deactivated) | Yes | `PEMISC@pChestId` | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| [`lib_heart.xlsx`](/originals/cf4/libraries/lib_heart.xlsx) | `tsekap_lib_heart` | HEART ID, HEART DESCRIPTION, LIBRARY STATUS | 10 (8 active, 2 deactivated) | Yes | `PEMISC@pHeartId` | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| [`lib_abdomen.xlsx`](/originals/cf4/libraries/lib_abdomen.xlsx) | `tsekap_lib_abdomen` | ABDOMEN ID, ABDOMEN DESCRIPTION, LIBRARY STATUS | 14 (8 active, 6 deactivated) | Yes | `PEMISC@pAbdomenId` | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| [`lib_neuro.xlsx`](/originals/cf4/libraries/lib_neuro.xlsx) | `tsekap_lib_neuro` | NEURO ID, NEURO DESCRIPTION, LIBRARY STAT | 14 (9 active, 5 deactivated) | Yes | `PEMISC@pNeuroId` | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| [`lib_genitourinary.xlsx`](/originals/cf4/libraries/lib_genitourinary.xlsx) | `tsekap_lib_genitourinary` | GU ID, GU DESCRIPTION, LIBRARY STATUS | 5 (all active) | Yes | `PEMISC@pGuId` | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| [`lib_chief_complaint.xlsx`](/originals/cf4/libraries/lib_chief_complaint.xlsx) | `tsekap_lib_symptoms (1)` | SYMPTOMS ID, SYMPTOMS DESCRIPTION, LIBRARY STATUS | 39 (36 active, 3 deactivated) | Yes | `SUBJECTIVE@pSignsSymptoms` (**not** `pChiefComplaint`) | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| [`lib_icd.xlsx`](/originals/cf4/libraries/lib_icd.xlsx) | `tsekap_lib_icd` | ICD Code, ICD Description, Library Status | 7,897 (all active) | Yes | `ICDS@pIcdCode` (CF4 only uses the default `000`) | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| [`lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx) | `tsekap_lib_medicine` | Drug Code, Drug Description, Gen Code, Salt Code, Form Code, Strength Code, Unit Code, Package Code | 2,427 (incl. NOMED) | No | `MEDICINE@pDrugCode` and the six component codes | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_generic.xlsx`](/originals/cf4/libraries/lib_medicine_generic.xlsx) | `tsekap_lib_meds_generic` | GENERIC CODE, GENERIC DESCRIPTION | 2,072 (incl. NOMED) | No | `MEDICINE@pGenericCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_salt.xlsx`](/originals/cf4/libraries/lib_medicine_salt.xlsx) | `Sheet1` (plus empty `Sheet2`, `Sheet3`) | SALT CODE, SALT DESCRIPTION | 61 (incl. `00000`) | No | `MEDICINE@pSaltCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_strength.xlsx`](/originals/cf4/libraries/lib_medicine_strength.xlsx) | `tsekap_lib_meds_strength` | STRENGTH CODE, STRENGTH DESCRIPTION | 871 (incl. `00000`) | No | `MEDICINE@pStrengthCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_form.xlsx`](/originals/cf4/libraries/lib_medicine_form.xlsx) | `tsekap_lib_meds_form` | FORM CODE, FORM DESCRIPTION | 401 (incl. `00000`), plus 1 stray header row | No | `MEDICINE@pFormCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_unit.xlsx`](/originals/cf4/libraries/lib_medicine_unit.xlsx) | `Sheet1` (plus empty `Sheet2`, `Sheet3`) | UNIT CODE, UNIT DESCRIPTION | 871 (incl. `00000`) | No | `MEDICINE@pUnitCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| [`lib_medicine_package.xlsx`](/originals/cf4/libraries/lib_medicine_package.xlsx) | `tsekap_lib_meds_package` | PACKAGE CODE, PACKAGE DESCRIPTION | 328 (incl. `00000`), plus 1 placeholder row `XXXX` | No | `MEDICINE@pPackageCode` | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |

Two more libraries are named in the dictionary but **not included** in the DevKit: `lib_diagnostic` (`DIAGNOSTIC@pDiagnosticId`) and `lib_management` (`MANAGEMENT@pManagementId`) ([dictionary p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)). For CF4 you don't need them: both attributes take the fixed default `0` ([KI-55](/known-issues#ki-55)). There is no rectal library either; `PEMISC@pRectalId` is a blank row in the dictionary.

## Library status: 1 = active, 0 = deactivated

The physical-exam libraries, `lib_chief_complaint` and `lib_icd` have a LIBRARY STATUS column (`LIBRARY STAT` in `lib_neuro`). A small legend next to the data (in `lib_genitourinary`, below it) reads "1 - ACTIVE" / "0 - DEACTIVATED" ("1 - ACTIVATE" in `lib_chief_complaint`), and each file carries the note:

> Note: Only with active library status shall be used.

So an entry with status `0` is kept for history only. Don't offer it in your UI and don't send it. Many old IDs are deactivated: for example HEENT `1`–`10` are deactivated and `11`–`18` are active. We checked the active entries against the tick boxes of the February 2020 paper form: they match one for one, with small wording differences such as "VOMITING/NAUSEA" for the form's "Vomiting" ([form p. 1–2](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)).

The medicine libraries have no status column.

## Physical examination libraries

Used by `PEMISC` (one ID per system). Every library has `99` "Others"; when you send `99`, put the finding in the matching `PESPECIFIC` remark (for example `pHeentRem`). If "Essentially normal" is selected, "other choices must be disabled" ([dictionary p. 7–8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7)). Tables are sorted by ID; the spreadsheets are not always in ID order. Descriptions are copied as-is, typos included.

::: details lib_skin → PEMISC@pSkinId (Skin/Extremities)
| ID | Description | Status |
|---|---|---|
| `1` | Essentially normal | 1 (active) |
| `2` | Clubbing | 1 (active) |
| `3` | Cold clammy | 1 (active) |
| `4` | Cyanosis/mottled skin | 1 (active) |
| `5` | Edema/swelling | 1 (active) |
| `6` | Decreased mobility | 1 (active) |
| `7` | Pale nailbeds | 1 (active) |
| `8` | Poor skin turgor | 1 (active) |
| `9` | Rashes/Petechiae | 1 (active) |
| `10` | Weak pulses | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_heent → PEMISC@pHeentId (HEENT)
| ID | Description | Status |
|---|---|---|
| `1` | Anicteric sclerae | 0 (deactivated) |
| `2` | Intact tympanic mebrane | 0 (deactivated) |
| `3` | Pupils brisky reactive to light | 0 (deactivated) |
| `4` | Tonsillopharyngeal congestion | 0 (deactivated) |
| `5` | Hypertropic tonsils | 0 (deactivated) |
| `6` | Alar flaring | 0 (deactivated) |
| `7` | Nasal discharge | 0 (deactivated) |
| `8` | Aural discharge | 0 (deactivated) |
| `9` | Palpable mass | 0 (deactivated) |
| `10` | Exudates | 0 (deactivated) |
| `11` | Essentially Normal | 1 (active) |
| `12` | Abnormal pupillary reaction | 1 (active) |
| `13` | Cervical lympadenopathy | 1 (active) |
| `14` | Dry mucous membrane | 1 (active) |
| `15` | Icteric sclerae | 1 (active) |
| `16` | Pale conjunctivae | 1 (active) |
| `17` | Sunken eyeballs | 1 (active) |
| `18` | Sunken fontanelle | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_chest → PEMISC@pChestId (Chest/Lungs)
| ID | Description | Status |
|---|---|---|
| `1` | Symmetrical chest expansion | 0 (deactivated) |
| `2` | Clear breath sounds | 0 (deactivated) |
| `3` | Retractions | 1 (active) |
| `4` | Crackles/rales | 1 (active) |
| `5` | Wheezes | 1 (active) |
| `6` | Essentially normal | 1 (active) |
| `7` | Asymmetrical chest expansion | 1 (active) |
| `8` | Decreased breath sounds | 1 (active) |
| `9` | Enlarge Axillary Lymph Nodes | 0 (deactivated) |
| `10` | Lumps over breast(s) | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_heart → PEMISC@pHeartId (CVS)
| ID | Description | Status |
|---|---|---|
| `1` | Adynamic precordium | 0 (deactivated) |
| `2` | Normal rate regular rhythm | 0 (deactivated) |
| `3` | Heaves/trills | 1 (active) |
| `4` | Murmurs | 1 (active) |
| `5` | Essentially normal | 1 (active) |
| `6` | Displaced apex beat | 1 (active) |
| `7` | Irregular rhythm | 1 (active) |
| `8` | Muffled heart sounds | 1 (active) |
| `9` | Pericardial bulge | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_abdomen → PEMISC@pAbdomenId (Abdomen)
| ID | Description | Status |
|---|---|---|
| `1` | Flat | 0 (deactivated) |
| `2` | Flabby | 0 (deactivated) |
| `3` | Globullar | 0 (deactivated) |
| `4` | Muscle guarding | 0 (deactivated) |
| `5` | Tenderness | 0 (deactivated) |
| `6` | Palpable mass | 0 (deactivated) |
| `7` | Essentially normal | 1 (active) |
| `8` | Abdominal rigidity | 1 (active) |
| `9` | Abdominal tenderness | 1 (active) |
| `10` | Hyperactive bowel sounds | 1 (active) |
| `11` | Palpable mass(es) | 1 (active) |
| `12` | Tympanitic/dull abdomen | 1 (active) |
| `13` | Uterine contraction | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_neuro → PEMISC@pNeuroId (Neuro-exam)
| ID | Description | Status |
|---|---|---|
| `1` | Developmental delay | 0 (deactivated) |
| `2` | Seizures | 0 (deactivated) |
| `3` | Normal | 0 (deactivated) |
| `4` | Motor Deficit | 0 (deactivated) |
| `5` | Sensory Deficit | 0 (deactivated) |
| `6` | Essentially normal | 1 (active) |
| `7` | Abnormal gait | 1 (active) |
| `8` | Abnormal position sense | 1 (active) |
| `9` | Abnormal sensation | 1 (active) |
| `10` | Abnormal reflex(es) | 1 (active) |
| `11` | Poor/altered memory | 1 (active) |
| `12` | Poor muscle tone/strength | 1 (active) |
| `13` | Poor coordination | 1 (active) |
| `99` | Others | 1 (active) |
:::

::: details lib_genitourinary → PEMISC@pGuId (GU (IE))
| ID | Description | Status |
|---|---|---|
| `1` | Essentially normal | 1 (active) |
| `2` | Blood stained in exam finger | 1 (active) |
| `3` | Cervical dilatation | 1 (active) |
| `4` | Presence of abnormal discharge | 1 (active) |
| `99` | Others | 1 (active) |
:::

## Signs and symptoms (lib_chief_complaint) {#signs-and-symptoms-lib-chief-complaint}

Despite its name, this library feeds `SUBJECTIVE@pSignsSymptoms`, "Pertinent Signs and Symptoms on Admission ID" (form part III.3). The chief complaint itself (`pChiefComplaint`) is free text. Send active IDs separated by semicolons. Our [example CF4](/examples/cf4-sample.xml) sends `3;18;26;37` (anorexia, headache, myalgia, fever) ([dictionary p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12)).

- `38` PAIN → also fill `pPainSite`.
- `X` OTHERS → also fill `pOtherComplaint`. `X` is the only non-numeric ID.
- "SKIN RASHES" appears twice: `29` (active) and `31` (deactivated). Use `29`.

::: details Full list (39 rows)
| ID | Description | Status |
|---|---|---|
| `1` | ALTERED MENTAL SENSORIUM | 1 (active) |
| `2` | ABDOMINAL CRAMP/PAIN | 1 (active) |
| `3` | ANOREXIA | 1 (active) |
| `4` | BLEEDING GUMS | 1 (active) |
| `5` | BODY WEAKNESS | 1 (active) |
| `6` | BLURRING OF VISION | 1 (active) |
| `7` | CONSTIPATION | 1 (active) |
| `8` | CHEST PAIN/DISCOMFORT | 1 (active) |
| `9` | COUGH | 1 (active) |
| `10` | DIARRHEA | 1 (active) |
| `11` | DIZZINESS | 1 (active) |
| `12` | DYSPHAGIA | 1 (active) |
| `13` | DYSPNEA | 1 (active) |
| `14` | DYSURIA | 1 (active) |
| `15` | EPISTAXIS | 1 (active) |
| `16` | FLANK OR LOWER BACK | 0 (deactivated) |
| `17` | FREQUENCY OF URINATION | 1 (active) |
| `18` | HEADACHE | 1 (active) |
| `19` | HEMATEMESIS | 1 (active) |
| `20` | HEMATURIA | 1 (active) |
| `21` | HEMOPTYSIS | 1 (active) |
| `22` | IRRITABILITY | 1 (active) |
| `23` | JAUNDICE | 1 (active) |
| `24` | LEG CRAMPS OR PAIN | 0 (deactivated) |
| `25` | LOWER EXTREMITY EDEMA | 1 (active) |
| `26` | MYALGIA | 1 (active) |
| `27` | ORTHOPNEA | 1 (active) |
| `28` | PALPITATIONS | 1 (active) |
| `29` | SKIN RASHES | 1 (active) |
| `30` | STOOL, BLOODY/BLACK TARRY/MUCOID | 1 (active) |
| `31` | SKIN RASHES | 0 (deactivated) |
| `32` | SWEATING | 1 (active) |
| `33` | SEIZURES | 1 (active) |
| `34` | URGENCY | 1 (active) |
| `35` | VOMITING/NAUSEA | 1 (active) |
| `36` | WEIGHT LOSS | 1 (active) |
| `37` | FEVER | 1 (active) |
| `38` | PAIN | 1 (active) |
| `X` | OTHERS | 1 (active) |
:::

## ICD codes (lib_icd)

`lib_icd.xlsx` has 7,897 rows, all with status `1`. The code column is formatted as text. For CF4 you only need its last row, `000` "Essentially Well Individual", the default for `ICDS@pIcdCode` ([dictionary p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)). The real diagnoses travel in the eClaims XML ([eClaims XML reference](/reference/eclaims-xml)). For example, the site's sample claim is for dengue: `lib_icd` lists `A90` "Dengue (fever) without warning signs", but the CF4 file still sends `000`.

Things to know if you reuse the file for anything else:

- 544 codes appear more than once, mostly with a different description each time (for example `H19.29` four times). 25 rows are exact duplicates of another row (for example `R05` "Cough" twice). Treat the file as a list of index terms, not a unique code table.
- 144 descriptions are cut at exactly 100 characters (some end mid-word).
- It contains codes in other shapes than `A00.0`: 97 codes with three decimals (such as `H25.010`), `E90*` with an asterisk, `000`, and `4660` "Newborn Screening", the only code stored as a number instead of text.
- The dictionary's DEFAULT column says `0000`, but the library has only `000`. See [Building CF4](/guides/cf4#fixed-default-values) and [KI-55](/known-issues#ki-55).

## Medicine libraries

### Drug code composition {#drug-code-composition}

`lib_medicine.xlsx` lists 2,427 drugs. The 30-character **Drug Code** (`pDrugCode`) is six 5-character component codes joined together, in this order:

| Characters | Component | XML attribute | Library | Example: `CEFTR0002000644SOL3200000VIALX` |
|---|---|---|---|---|
| 1–5 | Generic | `pGenericCode` | `lib_medicine_generic` | `CEFTR` = CEFTRIAXONE |
| 6–10 | Salt | `pSaltCode` | `lib_medicine_salt` | `00020` = DISODIUM/SODIUM SALT |
| 11–15 | Strength | `pStrengthCode` | `lib_medicine_strength` | `00644` = 1 g + 10 mL diluent |
| 16–20 | Form | `pFormCode` | `lib_medicine_form` | `SOL32` = SOLUTION |
| 21–25 | Unit | `pUnitCode` | `lib_medicine_unit` | `00000` = (not applicable) |
| 26–30 | Package | `pPackageCode` | `lib_medicine_package` | `VIALX` = VIAL |

Drug Description: "CEFTRIAXONE ( as DISODIUM/SODIUM SALT) 1 g + 10 mL diluent SOLUTION VIAL".

We derived this order by checking every row: 2,425 of the 2,427 codes equal Gen + Salt + Strength + Form + Unit + Package. The DevKit doesn't document it.

::: warning Column order is not code order
The spreadsheet's columns run **Gen, Salt, Form, Strength**, Unit, Package, but inside the code, **Strength comes before Form**. Don't rebuild codes by joining the columns left to right. Copy `pDrugCode` and the six component codes from the same row instead.
:::

The two rows that break the pattern:

| Drug Code | Problem |
|---|---|
| `LOSA100000014650000000000` (LOSARTAN + HYDROCHLOROTHIAZIDE 100 mg + 12.5 mg TABLET) | Only 25 characters: the form code `TAB49` from the Form Code column is missing from the code. |
| `TOLNA00000CREA30008200227TUB01` (TOLNAFTATE 0.10% CREAM 15 g TUBE) | Form (`CREA3`) and strength (`00082`) are in column order, the reverse of every other row. |

**The Unit code holds an amount, not a unit of measure.** For example, `019610000000000SOL3200195AMPUL` ("VITAMINS INTRAVENOUS, FAT-SOLUBLE SOLUTION 10 mL AMPULE") has unit code `00195`, which `lib_medicine_unit` describes as "10 mL". Most drugs (1,132 of 2,427) have unit `00000`.

### The `00000` "not applicable" code

Every component library except `lib_medicine_generic` has a `00000` entry. It means "no salt", "no unit", and so on:

| Library | `00000` description |
|---|---|
| `lib_medicine_salt` | a single space |
| `lib_medicine_strength` | `N/A` |
| `lib_medicine_form` | a single space (added in the 2021-02-23 update) |
| `lib_medicine_unit` | a single space |
| `lib_medicine_package` | `N/A` |

`lib_medicine_generic` uses `NOMED` instead (see next section).

### NOMED: no medicine given {#nomed}

The 2021-02-23 update added a "no medicine" record ([update p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1)). The data dictionary rev. 4 of the same date lists the same codes ([p. 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13)), so they are not a 2025 addition ([KI-08](/known-issues#ki-08)). The update note doesn't say why the record was added; our reading is that the DTD requires at least one `MEDICINE`, so a confinement without drugs still needs a record:

| Library | Added value |
|---|---|
| `lib_medicine` | Drug Code `NOMED0000000000000000000000000` (NOMED + 25 zeros), description "DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE", components `NOMED`, `00000`, `00000`, `00000`, `00000`, `00000` (last row) |
| `lib_medicine_generic` | `NOMED` with the same description (last row) |
| `lib_medicine_form` | `00000` |

How to fill the whole `MEDICINE` element for NOMED is in [Building CF4](/guides/cf4#no-medicine-nomed). Neither document says which `pIsApplicable` value goes with the NOMED record ([KI-55](/known-issues#ki-55)). The 2025 SSVTF tests "Does the system support the additional library code for no medicine record?" ([SSVTF p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).

### Same list as the eSOA Medicine Library

The Drug Code and Drug Description columns of `lib_medicine.xlsx` are identical, row for row, to the eSOA [Annex F Medicine Library](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) (2,427 rows each, same order, including the NOMED row). The eSOA file has only those two columns. You can keep one drug master table for both CF4 `pDrugCode` and the eSOA drug item codes. See [eSOA libraries](/reference/libraries/esoa).

## Data-quality problems {#data-quality}

<Badge type="warning" text="Data quality" />

These files were edited in Excel, and some values were damaged ([KI-39](/known-issues#ki-39)). We scanned all 16 files; this is the complete list of problems we found.

### Percentages stored as fractions (strength and unit libraries)

36 strength codes that should read as a percentage are stored as a fraction (the percentage divided by 100), and the `%` sign is lost. Code `00073` is the worst case: the intended value is `0.004%`, but the strength library has the text `4E-5`, and the unit library has the number `4e-05` formatted so that Excel shows `0.00%`. The drug descriptions in `lib_medicine.xlsx` are correct, which is how we know the intended values.

::: details All 36 affected codes
| Code | `lib_medicine_strength` (text) | `lib_medicine_unit` (number → Excel shows) | Intended value | Drugs using it as strength (example) |
|---|---|---|---|---|
| `00073` | `4E-5` | `4e-05` → 0.00% | **0.004%** | 1 (e.g. TRAVOPROST 0.004% SOLUTION 2.5 mL BOTTLE) |
| `00074` | `0.0001` | `0.0001` → 0.01% | **0.01%** | 1 (e.g. FLUTICASONE OINTMENT ( as PROPIONATE) 0.01% OINTMENT 5 g TUBE) |
| `00075` | `0.0001` | `0.0001` → 0.01% | **0.01%** | 1 (e.g. CARBACHOL 0.01% SOLUTION 1.5 mL VIAL) |
| `00078` | `0.0005` | `0.0005` → 0.05% | **0.05%** | 21 (e.g. BETAMETHASONE 0.05% OINTMENT 15 g TUBE) |
| `00082` | `0.001` | `0.001` → 0.10% | **0.1%** | 5 (e.g. BETAMETHASONE ( as DIPROPIONATE) 0.10% OINTMENT 5 g TUBE) |
| `00084` | `0.0015` | `0.0015` → 0.15% | **0.15%** | 2 (e.g. BRIMONIDINE TARTRATE 0.15% OPHTHALMIC SOLUTION 5 mL BOTTLE) |
| `00085` | `0.0025` | `0.0025` → 0.25% | **0.25%** | 2 (e.g. BETAXOLOL ( as HYDROCHLORIDE) 0.25% EYE DROPS SUSPENSION 5 mL BOTTLE) |
| `00089` | `0.003` | `0.003` → 0.30% | **0.3%** | 9 (e.g. GENTAMICIN ( as SULFATE) 0.30% EYE DROPS SOLUTION 5 mL BOTTLE) |
| `00133` | `0.1` | `0.1` → 10% | **10%** | 42 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 10% SOLUTION 500 mL GLASS BOTTLE) |
| `00279` | `0.025` | `0.025` → 2.50% | **2.5%** | 7 (e.g. BENZOYL PEROXIDE 2.50% GEL 10 g TUBE) |
| `00289` | `0.2` | `0.2` → 20% | **20%** | 7 (e.g. ALBUMIN, HUMAN 20% SOLUTION 50 mL BOTTLE) |
| `00364` | `0.03` | `0.03` → 3% | **3%** | 5 (e.g. ACICLOVIR 3% EYE OINTMENT 4.5 g TUBE) |
| `00366` | `0.035` | `0.035` → 3.50% | **3.5%** | 4 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 3.50% SOLUTION 500 mL GLASS BOTTLE) |
| `00391` | `0.045` | `0.045` → 4.50% | **4.5%** | 0 (not used; value inferred) |
| `00462` | `0.06` | `0.06` → 6% | **6%** | 9 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 6% SOLUTION 250 mL GLASS BOTTLE) |
| `00475` | `0.07` | `0.07` → 7% | **7%** | 9 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 7% SOLUTION 500 mL GLASS BOTTLE) |
| `00479` | `0.7` | `0.7` → 70% | **70%** | 5 (e.g. ALCOHOL, ETHYL 70% SOLUTION 250 mL BOTTLE) |
| `00493` | `0.085` | `0.085` → 8.50% | **8.5%** | 6 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 8.50% SOLUTION 500 mL GLASS BOTTLE) |
| `00500` | `0.0912` | `0.0912` → 9.12% | **9.12%** | 3 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 9.12% SOLUTION 20 mL AMPULE) |
| `00512` | `0.5` | `0.5` → 50% | **50%** | 4 (e.g. AKAPULKO 50% LOTION 60 mL BOTTLE) |
| `00541` | `0.114` | `0.114` → 11.40% | **11.4%** | 6 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 11.40% SOLUTION 500 mL GLASS BOTTLE) |
| `00588` | `0.25` | `0.25` → 25% | **25%** | 5 (e.g. ALBUMIN, HUMAN 25% SOLUTION 50 mL BAG) |
| `00611` | `0.08` | `0.08` → 8% | **8%** | 6 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 8% SOLUTION 500 mL GLASS BOTTLE) |
| `00649` | `0.005` | `0.005` → 0.50% | **0.5%** | 30 (e.g. BETAXOLOL ( as HYDROCHLORIDE) 0.50% EYE DROPS SUSPENSION 5 mL BOTTLE) |
| `00655` | `0.0012` | `0.0012` → 0.12% | **0.12%** | 5 (e.g. CHLORHEXIDINE ( as GLUCONATE) 0.12% SOLUTION 500 mL BOTTLE) |
| `00658` | `0.04` | `0.04` → 4% | **4%** | 11 (e.g. BENZOYL PEROXIDE 4% CREAM 40 g TUBE) |
| `01033` | `0.0003` | `0.0003` → 0.03% | **0.03%** | 1 (e.g. OXYMETAZOLINE ( as HYDROCHLORIDE) 0.03% NASAL DROPS SOLUTION 15 mL BOTTLE) |
| `01062` | `0.01` | `0.01` → 1% | **1%** | 65 (e.g. ATROPINE ( as SULFATE) 1% EYE DROPS 5 mL BOTTLE) |
| `01083` | `0.075` | `0.075` → 7.50% | **7.5%** | 5 (e.g. POVIDONE IODINE 7.50% SURGICAL SKIN CLEANSER 120 mL BOTTLE) |
| `01117` | `0.17` | `0.17` → 17% | **17%** | 1 (e.g. SALICYLIC ACID 17% SOLUTION 13.3 mL BOTTLE) |
| `01314` | `0.02` | `0.02` → 2% | **2%** | 38 (e.g. CLOTRIMAZOLE 2% CREAM 15 g TUBE) |
| `01315` | `0.05` | `0.05` → 5% | **5%** | 39 (e.g. AMINO ACIDS, CRYSTALLINE STANDARD 5% SOLUTION 250 mL GLASS BOTTLE) |
| `01318` | `0.025` | `0.025` → 2.50% | **2.5%** | 0 (not used; value inferred) |
| `01320` | `0.09` | `0.09` → 9% | **9%** | 2 (e.g. AMINO ACID SOLUTIONS FOR HEPATIC FAILURE 9% SOLUTION 500 mL BOTTLE) |
| `01333` | `0.0125` | `0.0125` → 1.25% | **1.25%** | 1 (e.g. SODIUM HYPOCHLORITE 1.25% SOLUTION BOTTLE) |
| `01462` | `0.084` | `0.084` → 8.40% | **8.4%** | 2 (e.g. LIQUID BICARBONATE CONCENTRATE 8.40% CONCENTRATE 5 L) |

Codes `00391` and `01318` are not used by any drug; their intended values are inferred from the stored number.
:::

### Everything else

| File | Problem | Impact |
|---|---|---|
| `lib_medicine_unit.xlsx` | Its code list is the strength list: both files have the same 871 codes. Ignoring extra spaces (15 descriptions) and the text-versus-number storage of the 36 percentage values, every description is the same except `00000` (a space in the unit file, `N/A` in the strength file). | Not an error as such (unit codes hold amounts such as "10 mL"), but don't expect units like "mg" here. |
| `lib_medicine_unit.xlsx` | Row 2 is the damaged `00073`, out of order before `00000`. | See above. |
| `lib_medicine_form.xlsx` | Row 103 is a stray header row: `FORM_CODE` / `FORM_DESC`. | Skip it when loading. |
| `lib_medicine_package.xlsx` | Row 284 is a placeholder: `XXXX` / `XXXX` (the only 4-character code). | Skip it. No drug uses it. |
| `lib_medicine.xlsx` | Two drug codes break the composition rule (`LOSA1…`, 25 characters; `TOLNA…`, form and strength swapped). | Copy codes as given; don't validate by rebuilding. |
| `lib_medicine.xlsx` | 36 descriptions are cut at exactly 100 characters, which makes 8 descriptions ambiguous (e.g. an "AMIDOTRIZOATE … SOLUTION 2" prefix shared by 6 drugs). | Identify drugs by Drug Code, never by description. `pGenericName` allows 500 characters. |
| `lib_medicine_generic.xlsx` | 37 descriptions appear under two or more codes (e.g. ACICLOVIR = `ACICL` and `ACYCR`); four codes contain lowercase letters (`Ace30`, `AlFU2`, `AlFU3`, `AlFU4`); two codes have only 4 characters (`BMHI`, `UREA`), although `pGenericCode` is 5 characters in every drug code. No drug in `lib_medicine` uses `BMHI` or `UREA`. | Treat codes as case-sensitive strings. Don't pad or reject the 4-character codes; just don't expect them in drug codes. |
| `lib_medicine_salt.xlsx` | `00036` contains a line break between "MEGLUMINE AND/OR" and "SODIUM SALT"; `00058` reads "TYDROCHLORIDE". | Cosmetic. |
| `lib_medicine_unit.xlsx`, `lib_medicine_form.xlsx`, `lib_medicine_package.xlsx`, `lib_medicine_generic.xlsx` | 18 descriptions have trailing or double spaces: 15 in the unit file, one each in the form file (`FREEZE-DRIED POWDER +  RECONSTITUTION FLUID`) and the package file (`COMBO-PACK `), and one generic description that ends in three non-breaking spaces (U+00A0). | Trim (including U+00A0) for display. |
| Physical-exam libraries and `lib_chief_complaint` | IDs and statuses are stored as numbers, not text. In six files they are floating-point (`7.0`); in `lib_heent` and `lib_genitourinary`, integers. `lib_chief_complaint` mixes numbers with the text `X`. | Convert `7.0` to `7` before you put it in XML. |
| `lib_icd.xlsx` | `4660` is stored as a number; 544 codes repeat (25 rows are exact duplicates); 144 descriptions are cut at exactly 100 characters; 16 have double or trailing spaces. | See [ICD codes](#icd-codes-lib-icd). |
| `lib_chief_complaint.xlsx` | "SKIN RASHES" twice (`29` active, `31` deactivated); legend "1 - ACTIVATE". | Use `29`. |
| `lib_genitourinary.xlsx` | The status legend sits inside the data columns: rows 8–10 of column B hold "LIBRARY STATUS", "1 - ACTIVE" and "0 - DEACTIVATED", with an empty ID cell. | Skip rows whose ID cell is empty. |
| Headers | Trailing spaces in `ABDOMEN ID `, `HEENT ID `, `SKIN ID `; `lib_neuro` says `LIBRARY STAT`. | Match columns by position, or trim header names. |
| Descriptions | Typos kept from the source, e.g. "Globullar", "Intact tympanic mebrane", "Cervical lympadenopathy", "Hypertropic tonsils". | Cosmetic; the XML carries IDs. |

### Load the files safely

::: tip Recommendation (not from PhilHealth)
Load every code column as **text**, convert whole-number floats to integers, trim whitespace, skip non-data rows, and keep only active entries. Take drug descriptions from `lib_medicine.xlsx`, not from the strength or unit libraries.
:::

A minimal loader (our code, not PhilHealth's). Download the spreadsheets you need (links in the Sources box at the top of this page) into one folder, run `pip install openpyxl`, and run the code there:

```python
import openpyxl

SKIP_CODES = {"FORM_CODE", "XXXX"}          # stray header / placeholder rows

def code_text(v):
    if isinstance(v, float) and v.is_integer():
        v = int(v)                           # 7.0 -> 7
    return str(v).strip()

def load_library(path, status_col=None):
    """Return {code: description}. status_col: 0-based index of LIBRARY STATUS, if any."""
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    out = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or row[0] is None:
            continue
        code = code_text(row[0])
        if code.startswith("Note") or code in SKIP_CODES:
            continue
        if status_col is not None and code_text(row[status_col]) != "1":
            continue                         # "Only with active library status shall be used"
        desc = row[1]
        out[code] = desc.strip() if isinstance(desc, str) else desc
    return out

heent = load_library("lib_heent.xlsx", status_col=2)     # {'11': 'Essentially Normal', ...}
salts = load_library("lib_medicine_salt.xlsx")           # {'00000': '', '00001': 'ACETATE', ...}
```

The loader returns one description per code. That is fine for every file except `lib_icd.xlsx`, where codes repeat (see [ICD codes](#icd-codes-lib-icd)); keep a list instead if you need all its descriptions.

The component codes in the medicine files are already stored as text, so leading zeros (`00020`) survive as long as you don't convert them to numbers. If you export a file to CSV and open it in Excel again, Excel will strip them.

## Related pages

- [Building CF4](/guides/cf4): where each code goes, NOMED rules
- [CF4 XML reference](/reference/cf4-xml): `PEMISC`, `SUBJECTIVE`, `ICDS`, `MEDICINE`
- [eSOA libraries](/reference/libraries/esoa): the same medicine list, used for eSOA item codes
- [Known issues: KI-39](/known-issues#ki-39), [KI-08](/known-issues#ki-08), [KI-55](/known-issues#ki-55)
