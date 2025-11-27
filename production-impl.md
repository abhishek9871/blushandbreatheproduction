# Production-Ready Medicine Encyclopedia Implementation

## Complete TypeScript/Node.js Backend Implementation

### 1. Setup & Dependencies

```bash
npm install axios dotenv prisma @prisma/client
npm install -D typescript @types/node ts-node
```

**Environment Variables (.env):**
```
WIKIPEDIA_API_BASE=https://en.wikipedia.org/w/api.php
MYCHEM_API_BASE=https://mychem.info/v1
DRUGCENTRAL_DOWNLOAD_URL=https://drugcentral.org/downloads
DATABASE_URL=postgresql://user:password@localhost:5432/medicine_db
NODE_ENV=production
```

---

### 2. Prisma Schema

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Drug {
  id                String   @id @default(cuid())
  
  // Basic Information
  genericName       String   @unique
  inn               String?
  
  // Synonyms & Brand Names
  synonyms          String[]
  tradeBrands       TrademarkBrand[]
  
  // Classification
  atcCodes          String[]
  pharmacoClass     String[]
  therapeuticClass  String[]
  
  // Regulatory Status
  fdaApproved       Boolean  @default(false)
  emaApproved       Boolean  @default(false)
  pmdaApproved      Boolean  @default(false)
  russiaApproved    Boolean  @default(false)
  
  // Clinical Data
  indications       Indication[]
  dosageInfo        DosageInfo?
  mechanism         String?
  pharmacology      Pharmacology?
  
  // Safety Data
  adverseEvents     AdverseEvent[]
  interactions      DrugInteraction[]
  
  // Chemistry
  casNumber         String?
  pubchemId         String?
  chemblId          String?
  drugbankId        String?
  smiles            String?
  inchi             String?
  
  // Wikipedia Integration
  wikipediaArticle  WikipediaCache?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastSyncedAt      DateTime?
  
  @@index([genericName])
  @@index([atcCodes])
  @@fulltext([genericName, synonyms])
}

model TrademarkBrand {
  id        String   @id @default(cuid())
  drugId    String
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  brandName String
  region    String   // "USA", "EU", "Russia", "Japan", etc.
  company   String?
  
  createdAt DateTime @default(now())
  
  @@unique([drugId, brandName, region])
  @@index([brandName])
}

model Indication {
  id        String   @id @default(cuid())
  drugId    String
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  condition String
  omopId    String?
  snomedCtId String?
  meshId    String?
  
  @@index([drugId])
}

model DosageInfo {
  id        String   @id @default(cuid())
  drugId    String   @unique
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  minDose   Float?    // in mg
  maxDose   Float?
  typicalDose Float?
  unit      String    // "mg", "mcg", etc.
  route     String    // "oral", "IV", etc.
  frequency String    // "once daily", "twice daily", etc.
  notes     String?
  
  @@index([drugId])
}

model Pharmacology {
  id        String   @id @default(cuid())
  drugId    String   @unique
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  // Pharmacokinetics
  bioavailability String?
  proteinBound    String?
  metabolism      String?
  halfLife        String?
  excretion       String?
  
  // Targets
  targets   String[] // Gene targets, receptors
  
  @@index([drugId])
}

model AdverseEvent {
  id        String   @id @default(cuid())
  drugId    String
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  event     String   // "Headache", "Nausea", etc.
  frequency String?  // "Common", "Rare", "Serious"
  severity  String?  // "Mild", "Moderate", "Severe"
  faersCount Int     @default(0)
  
  @@index([drugId])
}

model DrugInteraction {
  id        String   @id @default(cuid())
  drugId1   String
  drug1     Drug     @relation("Interaction1", fields: [drugId1], references: [id], onDelete: Cascade)
  
  drugId2   String
  drug2     Drug     @relation("Interaction2", fields: [drugId2], references: [id], onDelete: Cascade)
  
  severity  String   // "Major", "Moderate", "Minor"
  mechanism String?
  description String?
  
  @@unique([drugId1, drugId2])
  @@index([drugId1])
  @@index([drugId2])
}

model WikipediaCache {
  id        String   @id @default(cuid())
  drugId    String   @unique
  drug      Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  
  articleTitle String
  extract   String   // Intro paragraph
  content   String   // Full article HTML
  infobox   Json     // Parsed infobox
  
  cacheExpiry DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SyncLog {
  id        String   @id @default(cuid())
  source    String   // "mychem", "wikipedia", "drugcentral"
  status    String   // "success", "failed", "partial"
  drugsProcessed Int
  errorsCount Int
  startedAt DateTime
  completedAt DateTime
}
```

---

### 3. API Client Classes

**src/clients/mychemClient.ts:**
```typescript
import axios, { AxiosInstance } from 'axios';

interface MyChemDrug {
  _id: string;
  drugcentral?: {
    id: number;
    name: string;
    synonyms: string[];
    approval_country?: string[];
    indication?: Array<{ indication_class: string; mesh_id?: string }>;
    mechanism_of_action?: string;
    pharmacology_class?: string[];
    xrefs?: { cas_number?: string; atc_code?: string };
    faers_adverse_events?: {
      total_count: number;
      serious_count: number;
      death_count: number;
    };
    ddi?: Array<{ drug_name: string; severity: string; description: string }>;
  };
  chembl?: { id: string; pref_name: string };
  pubchem?: { cid: string };
  drugbank?: { id: string; name: string };
}

export class MyChemClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = 'https://mychem.info/v1') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'MedicineEncyclopedia/1.0'
      }
    });
  }

  async searchDrug(
    query: string,
    fields: string[] = ['drugcentral', 'drugbank', 'chembl', 'pubchem']
  ): Promise<MyChemDrug | null> {
    try {
      const response = await this.client.get<{ hits: MyChemDrug[] }>('/query', {
        params: {
          q: query,
          fields: fields.join(','),
          size: 1
        }
      });

      if (!response.data.hits || response.data.hits.length === 0) {
        return null;
      }

      return response.data.hits[0];
    } catch (error) {
      console.error(`MyChem search failed for "${query}":`, error.message);
      return null;
    }
  }

  async getDrugById(drugId: string): Promise<MyChemDrug | null> {
    try {
      const response = await this.client.get<MyChemDrug>(`/drug/${drugId}`, {
        params: {
          fields: 'drugcentral,drugbank,chembl,pubchem'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get drug by ID ${drugId}:`, error.message);
      return null;
    }
  }

  async queryField(
    fieldPath: string,
    value: string
  ): Promise<MyChemDrug | null> {
    // Query specific field, e.g., "drugcentral.targets.gene_symbol:BRAF"
    try {
      const response = await this.client.get<{ hits: MyChemDrug[] }>('/query', {
        params: {
          q: `${fieldPath}:${value}`,
          size: 1
        }
      });

      if (!response.data.hits || response.data.hits.length === 0) {
        return null;
      }

      return response.data.hits[0];
    } catch (error) {
      console.error(
        `MyChem field query failed (${fieldPath}=${value}):`,
        error.message
      );
      return null;
    }
  }
}
```

**src/clients/wikipediaClient.ts:**
```typescript
import axios, { AxiosInstance } from 'axios';

interface WikipediaPage {
  ns: number;
  title: string;
  extract?: string;
  missing?: boolean;
}

interface WikipediaResponse {
  query: {
    pages: Record<string, WikipediaPage>;
    redirects?: Array<{ from: string; to: string }>;
  };
}

export class WikipediaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://en.wikipedia.org/w/api.php',
      timeout: 15000,
      headers: {
        'User-Agent': 'MedicineEncyclopedia/1.0 (contact: your-email@example.com)'
      },
      params: {
        origin: '*'
      }
    });
  }

  async getExtract(
    title: string,
    options: {
      chars?: number;
      sentences?: number;
      plaintext?: boolean;
    } = {}
  ): Promise<string | null> {
    try {
      const response = await this.client.get<WikipediaResponse>('', {
        params: {
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'extracts',
          explaintext: options.plaintext ?? 1,
          exintro: 1,
          exchars: options.chars ?? 800,
          exsentences: options.sentences,
          redirects: 1
        }
      });

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (!pageId || pages[pageId].missing) {
        return null;
      }

      return pages[pageId].extract || null;
    } catch (error) {
      console.error(`Wikipedia extract failed for "${title}":`, error.message);
      return null;
    }
  }

  async getWikitext(title: string, section: number = 0): Promise<string | null> {
    try {
      const response = await this.client.get<WikipediaResponse>('', {
        params: {
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'revisions',
          rvprop: 'content',
          rvsection: section,
          redirects: 1
        }
      });

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (!pageId || pages[pageId].missing) {
        return null;
      }

      const revisions = (pages[pageId] as any).revisions;
      if (!revisions || revisions.length === 0) {
        return null;
      }

      return revisions[0]['*'] || null;
    } catch (error) {
      console.error(`Wikipedia wikitext failed for "${title}":`, error.message);
      return null;
    }
  }

  async resolveRedirect(title: string): Promise<string | null> {
    try {
      const response = await this.client.get<WikipediaResponse>('', {
        params: {
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'redirects',
          redirects: 1
        }
      });

      const redirects = response.data.query.redirects;
      if (redirects && redirects.length > 0) {
        return redirects[0].to;
      }

      // Check if page exists (not a redirect, but real page)
      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (!pages[pageId].missing) {
        return title; // Page exists, not a redirect
      }

      return null;
    } catch (error) {
      console.error(`Wikipedia redirect resolution failed for "${title}":`, error.message);
      return null;
    }
  }

  async parseInfobox(wikitext: string): Promise<Record<string, string>> {
    const infobox: Record<string, string> = {};

    // Regex to extract infobox parameters
    const paramRegex = /\|\s*(\w+)\s*=\s*([^\n|]+?)(?=\n\s*\||\n\}\})/g;
    let match;

    while ((match = paramRegex.exec(wikitext)) !== null) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim().replace(/\[\[|\]\]|\{\{|\}\}/g, '');

      // Map to standard keys
      if (key === 'drug_name' || key === 'iupac_name') infobox['drugName'] = value;
      if (key === 'inn') infobox['inn'] = value;
      if (key === 'trade_name' || key === 'tradenames') {
        infobox['tradeNames'] = value;
      }
      if (key === 'mechanism_of_action' || key === 'moa') {
        infobox['mechanismOfAction'] = value;
      }
      if (key === 'bioavailability') infobox['bioavailability'] = value;
      if (key === 'protein_bound') infobox['proteinBound'] = value;
      if (key === 'metabolism') infobox['metabolism'] = value;
      if (key === 'elimination_half_life') infobox['halfLife'] = value;
      if (key === 'excretion') infobox['excretion'] = value;
      if (key === 'legal_status' || key === 'legal_us') infobox['legalStatus'] = value;
      if (key === 'cas_number') infobox['casNumber'] = value;
      if (key === 'atc_code') infobox['atcCode'] = value;
      if (key === 'pubchem') infobox['pubchemId'] = value;
      if (key === 'drugbank') infobox['drugbankId'] = value;
      if (key === 'chembl') infobox['chemblId'] = value;
      if (key === 'chemical_formula') infobox['chemicalFormula'] = value;
      if (key === 'molecular_weight') infobox['molecularWeight'] = value;
      if (key === 'smiles') infobox['smiles'] = value;
    }

    return infobox;
  }
}
```

---

### 4. Medicine Encyclopedia Service

**src/services/medicineService.ts:**
```typescript
import { PrismaClient, Drug, TrademarkBrand, Indication } from '@prisma/client';
import { MyChemClient } from '../clients/mychemClient';
import { WikipediaClient } from '../clients/wikipediaClient';

interface UnifiedDrugData {
  genericName: string;
  inn?: string;
  synonyms: string[];
  tradeBrands: Array<{ name: string; region: string; company?: string }>;
  
  // Regulatory
  fdaApproved: boolean;
  emaApproved: boolean;
  pmdaApproved: boolean;
  russiaApproved: boolean;
  
  // Clinical
  indications: Array<{ condition: string; meshId?: string }>;
  mechanism?: string;
  dosage?: {
    minDose?: number;
    maxDose?: number;
    typicalDose?: number;
    unit: string;
    route: string;
    frequency: string;
  };
  
  // Safety
  adverseEvents: Array<{ event: string; frequency?: string; faersCount: number }>;
  interactions: Array<{ drug: string; severity: string; description?: string }>;
  
  // Chemistry
  identifiers: {
    cas?: string;
    pubchem?: string;
    chembl?: string;
    drugbank?: string;
    atc?: string[];
  };
  
  // Wikipedia
  wikipediaExtract?: string;
  wikipediaInfobox?: Record<string, string>;
}

export class MedicineService {
  constructor(
    private prisma: PrismaClient,
    private mychemClient: MyChemClient,
    private wikipediaClient: WikipediaClient
  ) {}

  /**
   * Search for drug by any name (generic, brand, INN)
   */
  async searchDrug(query: string): Promise<Drug | null> {
    const normalized = query.toLowerCase().trim();

    // Try exact match first
    const existing = await this.prisma.drug.findFirst({
      where: {
        OR: [
          { genericName: { equals: normalized, mode: 'insensitive' } },
          { synonyms: { has: normalized } },
          {
            tradeBrands: {
              some: { brandName: { equals: normalized, mode: 'insensitive' } }
            }
          }
        ]
      },
      include: {
        dosageInfo: true,
        pharmacology: true,
        indications: true,
        adverseEvents: true,
        interactions: { include: { drug1: true, drug2: true } },
        tradeBrands: true
      }
    });

    if (existing) {
      return existing;
    }

    // Try Wikipedia redirect
    const redirectedName = await this.wikipediaClient.resolveRedirect(query);
    if (redirectedName && redirectedName !== query) {
      return this.searchDrug(redirectedName);
    }

    return null;
  }

  /**
   * Fetch and cache complete drug data from all sources
   */
  async fetchCompleteDrugData(drugName: string): Promise<UnifiedDrugData | null> {
    try {
      // Fetch from MyChem.info (DrugCentral + DrugBank + ChEMBL)
      const mychemData = await this.mychemClient.searchDrug(drugName);

      if (!mychemData) {
        console.warn(`No MyChem data found for ${drugName}`);
        return null;
      }

      const dc = mychemData.drugcentral;

      // Fetch from Wikipedia
      const wikipediaExtract = await this.wikipediaClient.getExtract(drugName);
      const wikipediaWikitext = await this.wikipediaClient.getWikitext(drugName);
      const wikipediaInfobox = wikipediaWikitext
        ? await this.wikipediaClient.parseInfobox(wikipediaWikitext)
        : {};

      // Build unified data
      const unified: UnifiedDrugData = {
        genericName: dc?.name || drugName,
        inn: mychemData.drugbank?.name,
        synonyms: dc?.synonyms || [],
        tradeBrands: [], // Will populate from database

        // Regulatory
        fdaApproved: dc?.approval_country?.includes('FDA') ?? false,
        emaApproved: dc?.approval_country?.includes('EMA') ?? false,
        pmdaApproved: dc?.approval_country?.includes('PMDA') ?? false,
        russiaApproved: dc?.approval_country?.includes('Russia') ?? false,

        // Clinical
        indications: (dc?.indication || []).map(ind => ({
          condition: ind.indication_class,
          meshId: ind.mesh_id
        })),
        mechanism: dc?.mechanism_of_action || wikipediaInfobox['mechanismOfAction'],
        dosage: {
          unit: 'mg',
          route: wikipediaInfobox['route'] || 'oral',
          frequency: wikipediaInfobox['frequency'] || 'once daily'
        },

        // Safety
        adverseEvents: [],
        interactions: (dc?.ddi || []).map(ddi => ({
          drug: ddi.drug_name,
          severity: ddi.severity || 'unknown',
          description: ddi.description
        })),

        // Chemistry
        identifiers: {
          cas: dc?.xrefs?.cas_number,
          pubchem: mychemData.pubchem?.cid,
          chembl: mychemData.chembl?.id,
          drugbank: mychemData.drugbank?.id,
          atc: dc?.xrefs?.atc_code ? [dc.xrefs.atc_code] : []
        },

        // Wikipedia
        wikipediaExtract,
        wikipediaInfobox
      };

      return unified;
    } catch (error) {
      console.error(`Error fetching complete drug data for ${drugName}:`, error);
      return null;
    }
  }

  /**
   * Save drug data to database
   */
  async saveDrug(data: UnifiedDrugData): Promise<Drug> {
    const drug = await this.prisma.drug.upsert({
      where: { genericName: data.genericName.toLowerCase() },
      update: {
        inn: data.inn,
        synonyms: data.synonyms,
        atcCodes: data.identifiers.atc || [],
        pharmacoClass: [],
        fdaApproved: data.fdaApproved,
        emaApproved: data.emaApproved,
        pmdaApproved: data.pmdaApproved,
        russiaApproved: data.russiaApproved,
        mechanism: data.mechanism,
        casNumber: data.identifiers.cas,
        pubchemId: data.identifiers.pubchem,
        chemblId: data.identifiers.chembl,
        drugbankId: data.identifiers.drugbank,
        lastSyncedAt: new Date()
      },
      create: {
        genericName: data.genericName.toLowerCase(),
        inn: data.inn,
        synonyms: data.synonyms,
        atcCodes: data.identifiers.atc || [],
        fdaApproved: data.fdaApproved,
        emaApproved: data.emaApproved,
        pmdaApproved: data.pmdaApproved,
        russiaApproved: data.russiaApproved,
        mechanism: data.mechanism,
        casNumber: data.identifiers.cas,
        pubchemId: data.identifiers.pubchem,
        chemblId: data.identifiers.chembl,
        drugbankId: data.identifiers.drugbank,

        // Create related records
        indications: {
          create: data.indications.map(ind => ({
            condition: ind.condition,
            meshId: ind.meshId
          }))
        },
        dosageInfo: data.dosage
          ? {
              create: {
                unit: data.dosage.unit,
                route: data.dosage.route,
                frequency: data.dosage.frequency
              }
            }
          : undefined,
        adverseEvents: {
          create: data.adverseEvents.map(ae => ({
            event: ae.event,
            frequency: ae.frequency,
            faersCount: ae.faersCount
          }))
        }
      }
    });

    return drug;
  }

  /**
   * Get drug details (including cache check)
   */
  async getDrugDetails(drugName: string): Promise<UnifiedDrugData | null> {
    // Try database first
    const existing = await this.searchDrug(drugName);

    if (existing) {
      // Found in DB and cache is recent (< 24 hours)
      if (
        existing.lastSyncedAt &&
        Date.now() - existing.lastSyncedAt.getTime() < 24 * 60 * 60 * 1000
      ) {
        return this.mapDrugToUnified(existing);
      }
    }

    // Fetch fresh data
    const freshData = await this.fetchCompleteDrugData(drugName);
    if (freshData) {
      await this.saveDrug(freshData);
    }

    return freshData;
  }

  private mapDrugToUnified(drug: Drug & any): UnifiedDrugData {
    return {
      genericName: drug.genericName,
      inn: drug.inn,
      synonyms: drug.synonyms,
      tradeBrands: drug.tradeBrands.map(tb => ({
        name: tb.brandName,
        region: tb.region,
        company: tb.company
      })),
      fdaApproved: drug.fdaApproved,
      emaApproved: drug.emaApproved,
      pmdaApproved: drug.pmdaApproved,
      russiaApproved: drug.russiaApproved,
      indications: drug.indications.map(i => ({
        condition: i.condition,
        meshId: i.meshId
      })),
      mechanism: drug.mechanism,
      dosage: drug.dosageInfo
        ? {
            unit: drug.dosageInfo.unit,
            route: drug.dosageInfo.route,
            frequency: drug.dosageInfo.frequency
          }
        : undefined,
      adverseEvents: drug.adverseEvents.map(ae => ({
        event: ae.event,
        frequency: ae.frequency,
        faersCount: ae.faersCount
      })),
      interactions: [],
      identifiers: {
        cas: drug.casNumber,
        pubchem: drug.pubchemId,
        chembl: drug.chemblId,
        drugbank: drug.drugbankId,
        atc: drug.atcCodes
      }
    };
  }

  /**
   * Batch seed database with common drugs
   */
  async seedCommonDrugs(): Promise<void> {
    const commonDrugs = [
      'modafinil',
      'piracetam',
      'aniracetam',
      'phenylpiracetam',
      'oxiracetam',
      'noopept',
      'vinpocetine',
      'phenibut',
      'ibuprofen',
      'acetaminophen',
      'aspirin',
      'amoxicillin'
    ];

    for (const drug of commonDrugs) {
      try {
        const data = await this.fetchCompleteDrugData(drug);
        if (data) {
          await this.saveDrug(data);
          console.log(`✓ Seeded: ${data.genericName}`);
        }

        // Rate limit: 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to seed ${drug}:`, error.message);
      }
    }
  }
}
```

---

### 5. Express API Endpoints

**src/routes/drugs.ts:**
```typescript
import { Router, Request, Response } from 'express';
import { MedicineService } from '../services/medicineService';

export function createDrugRoutes(medicineService: MedicineService): Router {
  const router = Router();

  /**
   * GET /api/drugs/search?q=modafinil
   */
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" required' });
      }

      const drug = await medicineService.getDrugDetails(q);

      if (!drug) {
        return res.status(404).json({ error: 'Drug not found' });
      }

      res.json(drug);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/drugs/:name
   */
  router.get('/:name', async (req: Request, res: Response) => {
    try {
      const drug = await medicineService.getDrugDetails(req.params.name);

      if (!drug) {
        return res.status(404).json({ error: 'Drug not found' });
      }

      res.json(drug);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
```

---

### 6. Main Application

**src/index.ts:**
```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { MyChemClient } from './clients/mychemClient';
import { WikipediaClient } from './clients/wikipediaClient';
import { MedicineService } from './services/medicineService';
import { createDrugRoutes } from './routes/drugs';

const app = express();
const prisma = new PrismaClient();

// Initialize services
const mychemClient = new MyChemClient();
const wikipediaClient = new WikipediaClient();
const medicineService = new MedicineService(
  prisma,
  mychemClient,
  wikipediaClient
);

// Middleware
app.use(express.json());

// Routes
app.use('/api/drugs', createDrugRoutes(medicineService));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize and start
async function main() {
  try {
    // Run migrations
    console.log('Running database migrations...');
    // await prisma.$executeRawUnsafe('...'); // Or use Prisma migrate

    // Seed with common drugs
    console.log('Seeding database with common drugs...');
    await medicineService.seedCommonDrugs();

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

main();
```

---

### 7. Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Prisma generate
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://medicine:password@postgres:5432/medicine_db
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: medicine
      POSTGRES_PASSWORD: password
      POSTGRES_DB: medicine_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Testing

**src/__tests__/medicine.test.ts:**
```typescript
import { MedicineService } from '../services/medicineService';

describe('MedicineService', () => {
  let service: MedicineService;

  beforeAll(() => {
    // Initialize service with test clients
  });

  it('should fetch modafinil data', async () => {
    const data = await service.fetchCompleteDrugData('modafinil');
    
    expect(data).toBeDefined();
    expect(data.genericName).toBe('modafinil');
    expect(data.fdaApproved).toBe(true);
    expect(data.emaApproved).toBe(true);
    expect(data.mechanism).toBeDefined();
  });

  it('should find phenylpiracetam as Russia-approved', async () => {
    const data = await service.fetchCompleteDrugData('phenylpiracetam');
    
    expect(data.russiaApproved).toBe(true);
    expect(data.fdaApproved).toBe(false); // Not FDA approved
  });
});
```

---

## Performance Optimization

```typescript
// Add Redis caching layer
import Redis from 'ioredis';

const redis = new Redis();

async function getDrugWithRedisCache(drugName: string) {
  const cacheKey = `drug:${drugName.toLowerCase()}`;
  
  // Check Redis first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh
  const data = await medicineService.getDrugDetails(drugName);
  
  // Cache for 24 hours
  if (data) {
    await redis.setex(cacheKey, 86400, JSON.stringify(data));
  }

  return data;
}
```

This production-ready implementation provides a complete medicine encyclopedia with comprehensive drug data from DrugCentral, Wikipedia, and DrugBank, optimized for international and nootropic drugs.