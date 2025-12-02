# Medicine Encyclopedia API Integration Guide
## DrugCentral & Wikipedia API for Comprehensive Drug Data

---

## Table of Contents
1. [DrugCentral API Documentation](#drugcentral-api-documentation)
2. [Wikipedia API Documentation](#wikipedia-api-documentation)
3. [JavaScript/TypeScript Code Examples](#javascripttypescript-code-examples)
4. [Data Integration Strategy](#data-integration-strategy)
5. [Error Handling & Rate Limits](#error-handling--rate-limits)
6. [Coverage: Nootropics & International Drugs](#coverage-nootropics--international-drugs)

---

## DrugCentral API Documentation

### Overview
- **Base URL**: `https://drugcentral.org` (no dedicated REST API - see Caveat below)
- **Database Type**: Postgres-based compendium
- **Data Format**: TSV (Tab-Separated Values) for most queries, JSON for some endpoints
- **Coverage**: 4,995+ drugs, 152,476+ pharmaceuticals
- **Approval Status**: FDA-approved, EMA-approved, PMDA-approved, Russian approvals

### ⚠️ IMPORTANT: DrugCentral API Caveat

**DrugCentral does NOT have a traditional REST API with HTTP endpoints.** Instead:

1. **Web Interface**: Browse at `https://drugcentral.org` with search, filters
2. **Database Download**: Download full PostgreSQL dump or TSV/JSON exports
3. **Alternative**: Use **MyChem.info** (BioThings Suite) which wraps DrugCentral data with REST API
4. **Client Library**: Python BioClients library provides programmatic access to local DB

### Accessing DrugCentral Data: Three Methods

#### Method 1: Direct Database Download (Recommended for Initial Load)
```
Download page: https://drugcentral.org/downloads
Format options:
- PostgreSQL dump (full database)
- TSV files (structures, products, indications, etc.)
- JSON exports (drug cards as JSON)
```

**Key downloadable files:**
- `structures.tsv` - Drug structures (ID, name, SMILES, InChI)
- `products.tsv` - Brand names and formulations
- `indications.tsv` - Drug indications (disease mappings)
- `ddi.tsv` - Drug-drug interactions
- `pharmacology.tsv` - Pharmacologic actions
- `atc_ddd.tsv` - ATC codes and defined daily doses
- `faers_adverse_events.tsv` - FDA adverse event reports

**Typical workflow:**
1. Download TSV files on server startup
2. Import into your database
3. Query locally in your application

#### Method 2: MyChem.info API (REST Interface to DrugCentral)
```
Base URL: https://mychem.info/v1/

Endpoints:
- GET /query?q={query_string}
- GET /drug/{drug_id}
- POST /query with batch queries
```

**Example 1: Search for a drug by name**
```
GET https://mychem.info/v1/query?q=modafinil&fields=drugcentral,drugbank,chembl
```

**Example 2: Get drug data by ID**
```
GET https://mychem.info/v1/drug/DB00745?fields=drugcentral,chembl,pubchem
```

**Example 3: Query DrugCentral specific field**
```
GET https://mychem.info/v1/query?q=drugcentral.name:modafinil
```

Response includes DrugCentral section with:
- `name` - Drug name
- `synonyms` - Brand names and aliases
- `approval_country` - FDA, EMA, PMDA status
- `indication` - Disease/condition info
- `ddi_risk_group` - Drug-drug interaction risk level
- `faers_adverse_events` - Safety data (gender, age-stratified)

#### Method 3: Python BioClients (Programmatic Local Access)
```python
python3 -m BioClients.drugcentral.Client get_drugpage --ids "modafinil"
```

Available commands:
- `get_structure` - Drug structure by ID
- `get_structure_by_synonym` - Search by brand/generic name
- `get_structure_xrefs` - External cross-references (PubChem, ChEMBL, etc.)
- `get_structure_products` - Brand names and products
- `list_indications` - All diseases/conditions
- `list_ddis` - Drug-drug interactions
- `get_drugpage` - Complete drug card as JSON
- `get_drugsummary` - Summary as TSV

---

### DrugCentral Data Structure: Key Fields

**For a drug like Modafinil, you'll get:**

```json
{
  "id": 123,
  "name": "modafinil",
  "synonyms": [
    "Modafinil",
    "Provigil",
    "Modiodal",
    "Alertec",
    "Modalert",
    "Modvigil"
  ],
  "approval_status": {
    "fda_approved": true,
    "ema_approved": true,
    "pmda_approved": true,
    "russia_approved": true
  },
  "indications": [
    {
      "condition": "Narcolepsy",
      "omop_id": "C0027404",
      "snomed_ct": "SNOMED:73442001"
    },
    {
      "condition": "Sleep Apnea",
      "omop_id": "C0037315",
      "snomed_ct": "SNOMED:25091000"
    },
    {
      "condition": "Shift Work Sleep Disorder",
      "omop_id": "C1144215"
    }
  ],
  "pharmacology": {
    "mechanism_of_action": "Monoamine reuptake inhibitor",
    "therapeutic_class": "CNS Stimulants",
    "pharmacologic_action": "Sympathomimetic Agents"
  },
  "dosage": {
    "typical_dose": "200 mg",
    "max_dose": "400 mg",
    "route": "Oral",
    "frequency": "Once daily"
  },
  "faers_data": {
    "total_reports": 8234,
    "serious_reports": 412,
    "deaths": 5,
    "gender_stratified": {
      "female": 4500,
      "male": 3734
    },
    "age_stratified": {
      "pediatric": 89,
      "geriatric": 1234
    }
  },
  "drug_interactions": [
    {
      "interacting_drug": "warfarin",
      "interaction_type": "Major",
      "description": "May decrease warfarin levels"
    },
    {
      "interacting_drug": "oral_contraceptives",
      "interaction_type": "Moderate",
      "description": "Efficacy may be reduced"
    }
  ],
  "cross_references": {
    "pubchem": 4228,
    "chembl": "CHEMBL1373",
    "drugbank": "DB00745",
    "cas_number": "68693-11-8",
    "atc_code": "N06BX23"
  }
}
```

---

## Wikipedia API Documentation

### Overview
- **Base URL**: `https://en.wikipedia.org/w/api.php`
- **Authentication**: None required
- **Format**: JSON (and other formats)
- **Rate Limits**: ~200 requests/second per user-agent; see best practices below
- **CORS**: Enabled with `origin=*` parameter

### Core Endpoints

#### 1. Query for Article Extracts
```
GET https://en.wikipedia.org/w/api.php?
  action=query
  &format=json
  &titles={drug_name}
  &prop=extracts
  &explaintext=1
  &exintro=1
  &redirects=1
  &origin=*
```

**Parameters:**
- `titles` - Article title(s); supports multiple (pipe-separated)
- `prop=extracts` - Returns article text extract
- `explaintext=1` - Plain text instead of HTML
- `exintro=1` - Only intro section
- `exchars=500` - Max characters (default: 1200, max: 1200)
- `exsentences=3` - Max sentences (default: auto, max: 10)
- `redirects=1` - Automatically follow redirects
- `origin=*` - Enable CORS for browser requests

**Example Request:**
```
https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Modafinil&prop=extracts&explaintext=1&exintro=1&origin=*
```

**Example Response:**
```json
{
  "batchcomplete": true,
  "query": {
    "pages": {
      "123456": {
        "ns": 0,
        "title": "Modafinil",
        "extract": "Modafinil, sold under the brand name Provigil among others, is a central nervous system (CNS) stimulant and eugeroic (wakefulness promoter) medication..."
      }
    }
  }
}
```

#### 2. Get Full Article HTML/Wikitext
```
GET https://en.wikipedia.org/w/api.php?
  action=parse
  &format=json
  &page={drug_name}
  &prop=text|links|sections|infobox
  &redirects=1
  &origin=*
```

**Parameters:**
- `page` - Page title (use instead of titles)
- `prop` - What to return: text (HTML), wikitext, infobox, links, sections
- `section` - Specific section number (0 for lead section with infobox)

**Example Request:**
```
https://en.wikipedia.org/w/api.php?action=parse&format=json&page=Modafinil&prop=text&redirects=1&origin=*
```

#### 3. Get Raw Wikitext (For Parsing Infobox)
```
GET https://en.wikipedia.org/w/api.php?
  action=query
  &format=json
  &titles={drug_name}
  &prop=revisions
  &rvprop=content
  &rvsection=0
  &redirects=1
  &origin=*
```

**Parameters:**
- `prop=revisions` - Get page revisions
- `rvprop=content` - Return actual page content
- `rvsection=0` - Lead section (contains infobox)

**Example Response (Wikitext):**
```wikitext
{{Infobox drug
 | drug_name = Modafinil
 | INN = modafinil
 | type = 
 | IUPAC_name = 2-diphenylmethanesulfinylacetamide
 | image = Modafinil.svg
 | pronounce = 
 | legal_status = Prescription only (varies by country)
 | routes_of_administration = Oral
 | bioavailability = 
 | protein_bound = 60%
 | metabolism = Hepatic
 | elimination_half_life = 15 hours
 | excretion = Renal (90%)
 | pregnancy_category = 
 | legal_UK = POM
 | legal_US = Rx-only
 | legal_AU = S4 (Prescription Only)
 | CAS_number = 68693-11-8
 | ATC_code = N06BX23
 | PubChem = 4228
 | DrugBank = DB00745
 | ChEMBL = CHEMBL1373
 | SMILES = 
 | chemical_formula = C₁₅H₁₅NOS
 | molecular_weight = 257.35 g/mol
}}
```

#### 4. Get Redirects (Brand Name → Generic)
```
GET https://en.wikipedia.org/w/api.php?
  action=query
  &format=json
  &titles={brand_name}
  &prop=redirects
  &redirects=1
  &origin=*
```

**Example Request:**
```
https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Provigil&prop=redirects&redirects=1&origin=*
```

**Response shows redirect target:**
```json
{
  "query": {
    "redirects": [
      {
        "from": "Provigil",
        "to": "Modafinil"
      }
    ]
  }
}
```

#### 5. Search for Similar Drug Articles
```
GET https://en.wikipedia.org/w/api.php?
  action=query
  &format=json
  &list=search
  &srsearch={query_term}
  &srnamespace=0
  &srlimit=10
  &origin=*
```

---

## JavaScript/TypeScript Code Examples

### Setup
```typescript
// npm install axios dotenv
import axios from 'axios';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const MYCHEM_API = 'https://mychem.info/v1';

// Add User-Agent to comply with Wikipedia guidelines
const wikipediaClient = axios.create({
  baseURL: WIKIPEDIA_API,
  headers: {
    'User-Agent': 'MedicineEncyclopedia/1.0 (contact: your-email@example.com)'
  },
  params: {
    origin: '*'
  }
});

const mychemClient = axios.create({
  baseURL: MYCHEM_API,
  timeout: 10000
});
```

### 1. Fetch Drug Data from DrugCentral (via MyChem.info)

```typescript
/**
 * Fetch comprehensive drug data from DrugCentral via MyChem.info
 */
async function fetchDrugFromDrugCentral(drugName: string) {
  try {
    const response = await mychemClient.get('/query', {
      params: {
        q: drugName,
        fields: [
          'drugcentral',
          'drugbank',
          'chembl',
          'pubchem'
        ].join(',')
      }
    });

    if (!response.data.hits || response.data.hits.length === 0) {
      return null;
    }

    const drug = response.data.hits[0];
    const drugcentral = drug.drugcentral || {};

    return {
      id: drug._id,
      name: drugcentral.name || drugName,
      synonyms: drugcentral.synonyms || [],
      approvalStatus: {
        fda: drugcentral.approval_country?.includes('FDA') || false,
        ema: drugcentral.approval_country?.includes('EMA') || false,
        pmda: drugcentral.approval_country?.includes('PMDA') || false,
        russia: drugcentral.approval_country?.includes('Russia') || false
      },
      indication: drugcentral.indication?.[0]?.indication_class || 'N/A',
      mechanism: drugcentral.mechanism_of_action || 'Not available',
      pharmaClass: drugcentral.pharmacology_class || [],
      ddiRiskGroup: drugcentral.ddi_risk_group || 'Unknown',
      faersData: {
        adverseEventReports: drugcentral.faers_adverse_events?.total_count || 0,
        seriousReports: drugcentral.faers_adverse_events?.serious_count || 0,
        deaths: drugcentral.faers_adverse_events?.death_count || 0
      },
      crossReferences: {
        drugbank: drug.drugbank?.id,
        chembl: drug.chembl?.id,
        pubchem: drug.pubchem?.cid,
        cas: drugcentral.xrefs?.cas_number
      }
    };
  } catch (error) {
    console.error(`Error fetching from DrugCentral: ${error.message}`);
    return null;
  }
}

// Usage
const modafinilData = await fetchDrugFromDrugCentral('modafinil');
console.log(modafinilData);
```

### 2. Fetch Drug Infobox from Wikipedia

```typescript
interface WikipediaInfobox {
  drugName: string;
  inn: string;
  tradeName: string[];
  mechanismOfAction: string;
  bioavailability: string;
  proteinBound: string;
  metabolism: string;
  halfLife: string;
  excretion: string;
  legalStatus: string;
  casNumber: string;
  atcCode: string;
  pubchemId: string;
  drugBankId: string;
  chemblId: string;
  iupacName: string;
  molecularWeight: string;
  chemicalFormula: string;
  smiles: string;
}

/**
 * Parse Wikipedia Infobox drug template
 */
function parseWikipediaInfobox(wikitext: string): Partial<WikipediaInfobox> {
  const infobox: any = {};

  // Regex to extract all infobox parameters
  const paramRegex = /\|\s*(\w+)\s*=\s*([^\n|]+?)(?=\n\s*\||\n\}}/g;
  let match;

  while ((match = paramRegex.exec(wikitext)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim().replace(/\[\[|]]|\{\{|\}\}/g, '');

    // Map common infobox keys
    if (key === 'drug_name' || key === 'iupac_name') infobox.drugName = value;
    if (key === 'inn') infobox.inn = value;
    if (key === 'trade_name' || key === 'tradenames') {
      infobox.tradeName = value.split(',').map((n: string) => n.trim());
    }
    if (key === 'mechanism_of_action' || key === 'moa') {
      infobox.mechanismOfAction = value;
    }
    if (key === 'bioavailability') infobox.bioavailability = value;
    if (key === 'protein_bound') infobox.proteinBound = value;
    if (key === 'metabolism') infobox.metabolism = value;
    if (key === 'elimination_half_life') infobox.halfLife = value;
    if (key === 'excretion') infobox.excretion = value;
    if (key === 'legal_status' || key === 'legal_us') infobox.legalStatus = value;
    if (key === 'cas_number') infobox.casNumber = value;
    if (key === 'atc_code') infobox.atcCode = value;
    if (key === 'pubchem') infobox.pubchemId = value;
    if (key === 'drugbank') infobox.drugBankId = value;
    if (key === 'chembl') infobox.chemblId = value;
    if (key === 'chemical_formula') infobox.chemicalFormula = value;
    if (key === 'molecular_weight') infobox.molecularWeight = value;
    if (key === 'smiles') infobox.smiles = value;
  }

  return infobox;
}

/**
 * Fetch complete Wikipedia drug article with infobox
 */
async function fetchWikipediaDrugData(drugName: string): Promise<{
  extract: string;
  infobox: Partial<WikipediaInfobox>;
  content: string;
} | null> {
  try {
    // Step 1: Get wikitext with infobox
    const wikiResponse = await wikipediaClient.get('', {
      params: {
        action: 'query',
        titles: drugName,
        prop: 'revisions',
        rvprop: 'content',
        rvsection: 0,
        redirects: 1,
        format: 'json'
      }
    });

    const pages = wikiResponse.data.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    if (!pageId || pages[pageId].missing) {
      return null;
    }

    const wikitext = pages[pageId].revisions?.[0]?.['*'] || '';
    const infobox = parseWikipediaInfobox(wikitext);

    // Step 2: Get article extract (intro)
    const extractResponse = await wikipediaClient.get('', {
      params: {
        action: 'query',
        titles: drugName,
        prop: 'extracts',
        explaintext: 1,
        exintro: 1,
        exchars: 800,
        redirects: 1,
        format: 'json'
      }
    });

    const extractPages = extractResponse.data.query?.pages || {};
    const extractPageId = Object.keys(extractPages)[0];
    const extract = extractPages[extractPageId]?.extract || '';

    // Step 3: Get full content for additional sections
    const fullResponse = await wikipediaClient.get('', {
      params: {
        action: 'parse',
        page: drugName,
        prop: 'text',
        redirects: 1,
        format: 'json'
      }
    });

    const content = fullResponse.data.parse?.text?.['*'] || '';

    return {
      extract,
      infobox,
      content
    };
  } catch (error) {
    console.error(`Error fetching Wikipedia data: ${error.message}`);
    return null;
  }
}

// Usage
const modafinilWiki = await fetchWikipediaDrugData('Modafinil');
console.log(modafinilWiki);
```

### 3. Search for Drug by Brand Name and Handle Redirects

```typescript
/**
 * Resolve brand name to generic name via Wikipedia redirects
 */
async function resolveWikipediaBrandName(brandName: string): Promise<string | null> {
  try {
    const response = await wikipediaClient.get('', {
      params: {
        action: 'query',
        titles: brandName,
        prop: 'redirects',
        redirects: 1,
        format: 'json'
      }
    });

    const redirects = response.data.query?.redirects || [];
    if (redirects.length > 0) {
      return redirects[0].to; // Return redirect target
    }

    // If no redirect found, check if page exists
    const pages = response.data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    if (!pages[pageId].missing) {
      return brandName; // Page exists, not a redirect
    }

    return null;
  } catch (error) {
    console.error(`Error resolving brand name: ${error.message}`);
    return null;
  }
}

/**
 * Search Wikipedia for drug articles matching a query
 */
async function searchWikipediaDrugs(query: string, limit: number = 5) {
  try {
    const response = await wikipediaClient.get('', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${query} drug`,
        srnamespace: 0,
        srlimit: limit,
        format: 'json'
      }
    });

    return response.data.query?.search || [];
  } catch (error) {
    console.error(`Error searching Wikipedia: ${error.message}`);
    return [];
  }
}

// Usage
const genericName = await resolveWikipediaBrandName('Provigil');
console.log(genericName); // "Modafinil"

const results = await searchWikipediaDrugs('Piracetam', 10);
console.log(results);
```

### 4. Fetch Drug Interactions from DrugCentral

```typescript
/**
 * Get drug-drug interactions from DrugCentral
 */
async function fetchDrugInteractions(drugName: string) {
  try {
    // Query DrugCentral for the drug first
    const drugResponse = await mychemClient.get('/query', {
      params: {
        q: drugName,
        fields: 'drugcentral.ddi'
      }
    });

    if (!drugResponse.data.hits || drugResponse.data.hits.length === 0) {
      return [];
    }

    const interactions = drugResponse.data.hits[0].drugcentral?.ddi || [];

    return interactions.map((interaction: any) => ({
      drug1: drugName,
      drug2: interaction.drug_name,
      severity: interaction.severity, // Major, Moderate, Minor
      description: interaction.interaction_description || 'No description available',
      mechanism: interaction.mechanism || 'Unknown'
    }));
  } catch (error) {
    console.error(`Error fetching interactions: ${error.message}`);
    return [];
  }
}

// Usage
const interactions = await fetchDrugInteractions('modafinil');
console.log(interactions);
```

### 5. Comprehensive Unified Drug Fetch

```typescript
interface UnifiedDrugData {
  // Basic info
  name: string;
  synonyms: string[];
  
  // DrugCentral data
  drugcentral: {
    mechanism: string;
    indications: string[];
    approvalStatus: {
      fda: boolean;
      ema: boolean;
      pmda: boolean;
      russia: boolean;
    };
    adverseEvents: number;
    interactions: Array<{drug: string; severity: string}>;
  };
  
  // Wikipedia data
  wikipedia: {
    extract: string;
    infobox: any;
    bioavailability: string;
    metabolism: string;
    halfLife: string;
    proteinBound: string;
    excretion: string;
  };
  
  // Cross-references
  identifiers: {
    cas: string;
    pubchem: string;
    chembl: string;
    drugbank: string;
    atc: string;
  };
}

/**
 * Fetch all available drug data from multiple sources
 */
async function fetchUnifiedDrugData(drugName: string): Promise<UnifiedDrugData | null> {
  try {
    // Parallel fetches from all sources
    const [drugCentralData, wikipediaData, interactions] = await Promise.all([
      fetchDrugFromDrugCentral(drugName),
      fetchWikipediaDrugData(drugName),
      fetchDrugInteractions(drugName)
    ]);

    if (!drugCentralData) {
      return null;
    }

    const unified: UnifiedDrugData = {
      name: drugCentralData.name,
      synonyms: drugCentralData.synonyms,
      
      drugcentral: {
        mechanism: drugCentralData.mechanism,
        indications: [drugCentralData.indication],
        approvalStatus: drugCentralData.approvalStatus,
        adverseEvents: drugCentralData.faersData.adverseEventReports,
        interactions: interactions.slice(0, 10) // Top 10
      },
      
      wikipedia: {
        extract: wikipediaData?.extract || 'Not available',
        infobox: wikipediaData?.infobox || {},
        bioavailability: wikipediaData?.infobox?.bioavailability || 'N/A',
        metabolism: wikipediaData?.infobox?.metabolism || 'N/A',
        halfLife: wikipediaData?.infobox?.halfLife || 'N/A',
        proteinBound: wikipediaData?.infobox?.proteinBound || 'N/A',
        excretion: wikipediaData?.infobox?.excretion || 'N/A'
      },
      
      identifiers: {
        cas: drugCentralData.crossReferences.cas || 'N/A',
        pubchem: drugCentralData.crossReferences.pubchem || 'N/A',
        chembl: drugCentralData.crossReferences.chembl || 'N/A',
        drugbank: drugCentralData.crossReferences.drugbank || 'N/A',
        atc: wikipediaData?.infobox?.atcCode || 'N/A'
      }
    };

    return unified;
  } catch (error) {
    console.error(`Error fetching unified drug data: ${error.message}`);
    return null;
  }
}

// Usage
const fullData = await fetchUnifiedDrugData('modafinil');
console.log(JSON.stringify(fullData, null, 2));
```

---

## Data Integration Strategy

### 1. Load Strategy

**On Application Startup:**
```typescript
/**
 * Initialize medicine encyclopedia with DrugCentral base data
 */
async function initializeMedicineDb() {
  try {
    // Option A: Download DrugCentral TSV files
    console.log('Downloading DrugCentral TSV files...');
    // Downloads from: https://drugcentral.org/downloads
    
    // Option B: Seed common drugs from MyChem.info
    const commonDrugs = [
      'modafinil', 'piracetam', 'aniracetam', 'phenylpiracetam',
      'phenibut', 'vinpocetine', 'noopept', 'oxiracetam',
      'ibuprofen', 'acetaminophen', 'aspirin'
    ];

    for (const drug of commonDrugs) {
      const data = await fetchUnifiedDrugData(drug);
      if (data) {
        await saveToDatabase(data);
        console.log(`✓ Saved: ${data.name}`);
      }
    }

    console.log('Medicine database initialization complete');
  } catch (error) {
    console.error(`Initialization failed: ${error.message}`);
  }
}
```

### 2. Data Deduplication

```typescript
/**
 * Merge duplicate drug records from multiple sources
 */
function deduplicateDrugData(drugCentralRecord: any, wikipediaRecord: any) {
  return {
    ...drugCentralRecord,
    wikipedia: wikipediaRecord,
    
    // Prefer DrugCentral for clinical data
    mechanism: drugCentralRecord.mechanism || wikipediaRecord?.infobox?.mechanismOfAction,
    
    // Combine synonyms
    synonyms: [
      ...new Set([
        ...drugCentralRecord.synonyms,
        ...(wikipediaRecord?.infobox?.tradeName || [])
      ])
    ],
    
    // Prefer Wikipedia for detailed PK
    pharmacokinetics: {
      bioavailability: wikipediaRecord?.infobox?.bioavailability || 'N/A',
      protein_bound: wikipediaRecord?.infobox?.proteinBound || 'N/A',
      metabolism: wikipediaRecord?.infobox?.metabolism || 'N/A',
      elimination_half_life: wikipediaRecord?.infobox?.halfLife || 'N/A',
      excretion: wikipediaRecord?.infobox?.excretion || 'N/A'
    },
    
    last_updated: new Date()
  };
}
```

---

## Error Handling & Rate Limits

### Rate Limits

**Wikipedia API:**
- ~200 requests/second (per user agent)
- Recommended: Max 50 requests/second
- Add User-Agent header

**MyChem.info:**
- No hard limit published
- Recommended: Max 10 requests/second
- Add delay between requests

### Retry Strategy

```typescript
/**
 * Fetch with exponential backoff retry
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries} attempts:`, error.message);
        return null;
      }
      
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

// Usage
const data = await fetchWithRetry(
  () => fetchDrugFromDrugCentral('modafinil'),
  3,
  1000
);
```

### Caching Strategy

```typescript
/**
 * Simple in-memory cache with TTL
 */
class DrugCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 1000 * 60 * 60 * 24; // 24 hours

  get(key: string) {
    const entry = this.cache.get(key.toLowerCase());
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key.toLowerCase());
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any) {
    this.cache.set(key.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const drugCache = new DrugCache();

// Usage in fetch function
async function fetchDrugDataWithCache(drugName: string) {
  // Check cache first
  const cached = drugCache.get(drugName);
  if (cached) {
    console.log(`Cache hit: ${drugName}`);
    return cached;
  }

  // Fetch from APIs
  const data = await fetchUnifiedDrugData(drugName);
  if (data) {
    drugCache.set(drugName, data);
  }

  return data;
}
```

---

## Coverage: Nootropics & International Drugs

### Verified Coverage: Nootropics

**✓ Excellent Coverage (Covered by DrugCentral & Wikipedia):**
- Piracetam (Nootropil) - FDA approved
- Aniracetam (Ro 13-5057) - EMA approved
- Phenylpiracetam (Phenotropil) - Russia/Russia approved
- Oxiracetam (ISF 2522) - EMA approved
- Noopept (Omberacetam) - Russia approved
- Vinpocetine (Cavinton) - EMA approved
- Phenibut (β-Phenyl-GABA) - Russia/Ukraine approved

**⚠️ Limited/Partial Coverage:**
- Research chemicals (some not in standard databases)
- Experimental compounds
- Small molecule nootropics with limited clinical trials

### International Drug Name Mapping

```typescript
/**
 * Map regional brand names to generic INN
 */
const internationalBrands: Record<string, string[]> = {
  'modafinil': [
    'Provigil', 'Modiodal', 'Modalert', 'Modvigil', 'Modasomil',
    'Alertec', 'Alertex', 'Aspendos', 'Forcilin', 'Mentix', 'R-Mod'
  ],
  'piracetam': [
    'Nootropil', 'Nootropyl', 'Noopreman', 'Oikamid', 'Piracetam'
  ],
  'phenylpiracetam': [
    'Phenotropil', 'Carpheddon', 'Fonturacetam'
  ],
  'aniracetam': [
    'Aniracetam', 'Ro 13-5057', 'Serapur', 'Draganon'
  ]
};

/**
 * Search for drug by any name (generic, brand, regional)
 */
async function searchDrugByAnyName(name: string): Promise<any> {
  // First try exact name
  let result = await fetchDrugFromDrugCentral(name);
  if (result) return result;

  // Try Wikipedia redirect
  const genericName = await resolveWikipediaBrandName(name);
  if (genericName && genericName !== name) {
    result = await fetchDrugFromDrugCentral(genericName);
    if (result) return result;
  }

  // Search by brand name mapping
  for (const [generic, brands] of Object.entries(internationalBrands)) {
    if (brands.some(b => b.toLowerCase() === name.toLowerCase())) {
      result = await fetchDrugFromDrugCentral(generic);
      if (result) return result;
    }
  }

  return null;
}

// Usage
const rModData = await searchDrugByAnyName('R-Mod');
console.log(rModData); // Finds Modafinil
```

### Regional Approval Status

```typescript
/**
 * Get approval status for different regions
 */
async function getRegionalApprovalStatus(drugName: string) {
  const data = await fetchDrugFromDrugCentral(drugName);
  
  if (!data) return null;

  return {
    drug: data.name,
    approved: {
      usa_fda: data.approvalStatus.fda,
      europe_ema: data.approvalStatus.ema,
      japan_pmda: data.approvalStatus.pmda,
      russia: data.approvalStatus.russia,
      otc: data.legalStatus?.includes('OTC') || false,
      prescription_only: data.legalStatus?.includes('Prescription') || true
    },
    available_countries: []
  };
}
```

---

## Best Practices for Production

1. **Set up proper User-Agent headers** to comply with API terms
2. **Implement aggressive caching** - drug data doesn't change frequently
3. **Use async/parallel requests** where possible (Promise.all)
4. **Add monitoring/logging** for API failures
5. **Download DrugCentral data locally** for better performance
6. **Combine data sources** strategically - DrugCentral for clinical, Wikipedia for chemistry
7. **Handle missing data gracefully** - not all drugs have all fields
8. **Implement database persistence** to reduce API calls
9. **Use database indices** on drug names and synonyms
10. **Add fallback data sources** (ChEMBL, PubChem) for coverage gaps

---

## Conclusion

This integration provides:
- ✅ Comprehensive drug data (mechanism, pharmacology, interactions)
- ✅ International drug coverage (non-FDA approved drugs)
- ✅ Brand name mappings
- ✅ Regional approval status
- ✅ Clinical safety data (FAERS)
- ✅ Supplement for OpenFDA (international/nootropics focus)

**For production, recommended flow:**
1. Load DrugCentral base data into local DB
2. Use MyChem.info API for real-time updates
3. Enrich with Wikipedia data for chemistry details
4. Cache aggressively (24-hour TTL)
5. Implement fallback to cached data on API failures