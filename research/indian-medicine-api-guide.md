# Indian Medicine Database & APIs: Comprehensive Guide
## Free and Commercial Databases for Indian Pharmaceuticals

---

## Table of Contents
1. [Official Government Databases](#official-government-databases)
2. [Commercial Medicine Databases](#commercial-medicine-databases)
3. [Healthcare Platform APIs](#healthcare-platform-apis)
4. [API Integration Examples](#api-integration-examples)
5. [Data Coverage Comparison](#data-coverage-comparison)
6. [Implementation Strategy](#implementation-strategy)

---

## Official Government Databases

### 1. CDSCO SUGAM Portal (Central Drugs Standard Control Organization)
- **URL**: https://cdscoonline.gov.in/CDSCO/homepage
- **Database**: Comprehensive regulatory database for drug approvals
- **Type**: Government portal (not public REST API)
- **Authentication**: User registration + CDSCO approval required
- **Data Available**:
  - List of approved new drugs (downloadable PDFs, searchable database)
  - Drug licensing status
  - Manufacturer details
  - Import/Export NOC status
  - Clinical trial approvals
  - Regulatory status (FDA/EMA/PMDA/India approved)

**Key Features:**
```
- Search by drug name, manufacturer, approval status
- Filter by year of approval
- Download approval lists (PDF format)
- Manufacturer dashboard for tracking applications
- Real-time approval status tracking
```

**Download Resources:**
- Annual approved drugs list (1971-2025)
- Essential medicines list
- Reference product lists
- New drug approvals by division

**Note**: SUGAM is primarily an administrative portal for manufacturers, NOT a public medicine information API.

---

### 2. CDSCO Approved New Drugs List
- **URL**: https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/
- **Type**: Public downloadable data
- **Format**: PDF files (updated annually)
- **Coverage**: New drugs approved each year since 1971
- **Data Points**:
  - Drug name (generic + brand)
  - Manufacturer
  - Approval date
  - Drug classification
  - Dosage form

**Example Documents Available:**
- 2025 approved drugs (till October)
- 2024 approved drugs (till December)
- Historical approval lists (1971-2023)

---

### 3. Open Government Data Platform India
- **URL**: https://data.gov.in/apis/?sector=Health+and+Family+welfare
- **Status**: Limited health-related datasets
- **Current Result**: No APIs for pharmacy/medicines (as of November 2025)
- **Potential**: Government framework for data sharing, but not actively used for medicine data

---

### 4. CDSCO Licensed Medicines Database (SUGAM)
- **URL**: https://cdscoonline.gov.in/CDSCO/homepage
- **Type**: Manufacturer-facing regulatory database
- **Access**: Requires registration as pharmaceutical company
- **Data Includes**:
  - Manufacturer licenses
  - Manufacturing sites
  - Product formulations
  - Approval status by state
  - Post-approval changes

---

## Commercial Medicine Databases

### 1. DataRequisite - Indian Medicine Database
- **Company**: Data Requisite Solutions Pvt. Ltd.
- **URL**: https://datarequisite.com | https://indianmedicinedatabase.in
- **Type**: Comprehensive paid database
- **Coverage**: **4.1+ Lakhs (410,000+) medicines**
- **Data Points per Medicine**: 30+ fields including:
  - Generic name (INN)
  - Brand names
  - Manufacturer
  - Dosage form & strength
  - Salt composition
  - Package sizes
  - MRP/Price
  - Images
  - Regulatory status
  - Manufacturing date
  - Expiry information

**Pricing**: Custom (contact for quote)

**API Access**: 
- Limited users have access to API
- Primarily Excel file format
- Regular updates (frequent MRP updates)

**Integration**:
```
Format: Excel file or API (on request)
Data points: 30+ standardized fields
Update frequency: Regular (especially pricing)
Images: Mapped with Product ID (separate ZIP or URL format)
```

**Target Users**: Online pharmacies, digital healthcare platforms, pharmacy inventory systems

**Customers**: 300+ companies across India

---

### 2. myUpchar - Medicine API
- **Company**: myUpchar (Healthtech platform)
- **URL**: https://beta.myupchar.com/api/medicine/search
- **Type**: Public REST API for Indian medicines
- **Coverage**: **2 Lakhs (200,000+) medicines**
- **Authentication**: API key required

**API Endpoint**: 
```bash
GET https://beta.myupchar.com/api/medicine/search
```

**Query Parameters**:
```
- api_key=YOUR_API_KEY (required)
- name=MEDICINE_NAME
- type=MEDICINE_TYPE (Allopath/Ayurveda/General/Homeopath/Unani)
- manufacturer=MANUFACTURER_NAME
- category_id=CATEGORY_ID
- page=PAGE_NUMBER
```

**Example Request**:
```bash
curl "https://beta.myupchar.com/api/medicine/search?api_key=ABC123&name=Paracetamol&type=Allopath"
```

**Data Fields Returned**:
- Medicine name
- Dosage/strength
- Manufacturer
- Type (Allopath, Ayurveda, etc.)
- Category ID
- Prescription status
- Alternative medicines
- Uses
- Side effects

**Features**:
- Real-time pricing
- Alternative medicine suggestions
- Distributor information
- Medicine search & auto-suggestion
- Commission on sales

**Affiliate Model**: Earn commission on medicine sales through platform

---

### 3. MedGuide - Indian Pharma Database
- **Company**: Equality Healthcare Pvt. Ltd.
- **Type**: Mobile app + database
- **Platform**: Android & iOS
- **Coverage**: **4+ Lakh (400,000+) medicines**
- **Additional**: 60,000+ FMCG items

**Features**:
- Search by medicine name or salt content (API/INN)
- Find generic alternatives
- Barcode scanning
- Distributor locator
- Salt/ingredient search
- Real-time product database updates

**Note**: No official REST API, but data can be scraped from the app

**Database Fields**:
- Medicine name
- Salt content/INN
- Manufacturer
- Barcode
- Image
- Category
- Alternatives

**Update Frequency**: 100s of new products daily

---

### 4. 1mg (Tata 1mg) Pharmacy API
- **Company**: Tata 1mg (Major e-pharmacy platform)
- **URL**: https://onedoc.1mg.com/public_docs/ (Merchant documentation)
- **Type**: B2B merchant API (not public)
- **Authentication**: Merchant ID + JWT Token

**Available Endpoints**:

#### Search API
```bash
GET /search?query={search_term}
```

#### Static Drug Detail API
```bash
GET /drug/{drug_sku_id}
```
**Returns**:
- Drug name
- Manufacturer
- Composition
- Uses
- Side effects
- Dosage
- Storage info
- Packaging details

#### Dynamic Drug Detail API (Real-time)
```bash
GET /drug_dynamic/{drug_sku_id}
```
**Returns**:
- Current MRP
- Offer price
- Discount percentage
- Coupon codes
- Availability status
- Delivery time

#### Inventory Check API
```bash
POST /inventory/check
```
**Parameters**:
```json
{
  "items": [
    {
      "sku_id": "651662",
      "quantity": 1
    }
  ]
}
```

#### Product Details
- Drug name
- Manufacturer (Sun Pharma, Cipla, Dr. Reddy's, etc.)
- Composition (salt/active ingredient)
- Dosage form
- Strength/pack size
- MRP
- Current price
- Images
- Uses & indications
- Side effects
- Contraindications
- Storage conditions

**Access**: Requires partnership/merchant agreement with Tata 1mg

**Data Coverage**: Medicines + OTC products

---

## Healthcare Platform APIs

### 1. Practo Medicine Data Scraping
- **Type**: Healthcare platform with medicine data
- **Coverage**: Extensive Indian medicine database
- **Access**: Via scraping services (not official API)
- **Data Available**:
  - Doctor prescriptions patterns
  - Commonly prescribed medicines
  - Alternative medicines by condition
  - Brand alternatives
  - OTC medicine information

**Services Available** (via third-party scrapers):
- Medicine name, composition
- Manufacturer, price
- Dosage form, strength
- Uses, side effects
- Drug interactions
- Delivery information

**Limitation**: Not an official API; scraping-based access

---

### 2. API Setu (Government API Platform)
- **URL**: https://apisetu.gov.in
- **Type**: Government API marketplace
- **Status**: Framework exists for government APIs
- **Health APIs**: Limited pharmaceutical APIs currently available
- **Potential**: Could provide access to CDSCO/health ministry data

---

## API Integration Examples

### 1. myUpchar Medicine Search (Simple Example)

```javascript
// npm install axios

const axios = require('axios');

const MYUPCHAR_API_KEY = process.env.MYUPCHAR_API_KEY;
const MYUPCHAR_BASE_URL = 'https://beta.myupchar.com/api/medicine';

/**
 * Search for medicines in myUpchar database
 */
async function searchMedicine(medicineName) {
  try {
    const response = await axios.get(`${MYUPCHAR_BASE_URL}/search`, {
      params: {
        api_key: MYUPCHAR_API_KEY,
        name: medicineName,
        type: 'Allopath', // Filter by type
        page: 1
      }
    });

    return response.data;
  } catch (error) {
    console.error('Search error:', error.message);
    return null;
  }
}

/**
 * Get medicine by manufacturer
 */
async function searchByManufacturer(manufacturerName) {
  try {
    const response = await axios.get(`${MYUPCHAR_BASE_URL}/search`, {
      params: {
        api_key: MYUPCHAR_API_KEY,
        manufacturer: manufacturerName,
        page: 1
      }
    });

    return response.data;
  } catch (error) {
    console.error('Manufacturer search error:', error.message);
    return null;
  }
}

// Usage
(async () => {
  const paracetamol = await searchMedicine('Paracetamol');
  console.log('Paracetamol results:', paracetamol);

  const sunPharma = await searchByManufacturer('Sun Pharma');
  console.log('Sun Pharma medicines:', sunPharma);
})();
```

---

### 2. Tata 1mg JWT Token Generation

```typescript
// npm install jsonwebtoken axios

import jwt from 'jsonwebtoken';
import axios from 'axios';

interface JWT1mgConfig {
  merchantId: string;
  privateKey: string;
}

class Tata1mgClient {
  private config: JWT1mgConfig;
  private baseUrl = 'https://api.1mg.com/v1';

  constructor(config: JWT1mgConfig) {
    this.config = config;
  }

  /**
   * Generate JWT token for 1mg API
   */
  private generateJWTToken(): string {
    const payload = {
      merchant_id: this.config.merchantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    const token = jwt.sign(payload, this.config.privateKey, {
      algorithm: 'HS256'
    });

    return token;
  }

  /**
   * Search for drug by name
   */
  async searchDrug(drugName: string): Promise<any> {
    try {
      const token = this.generateJWTToken();

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: drugName,
          locale: 'en'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Platform': 'desktop',
          'X-City': 'Delhi'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Search error:', error.message);
      return null;
    }
  }

  /**
   * Get drug static details (fixed info)
   */
  async getDrugStaticDetails(drugSkuId: string): Promise<any> {
    try {
      const token = this.generateJWTToken();

      const response = await axios.get(
        `${this.baseUrl}/drug/${drugSkuId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Platform': 'desktop'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Details fetch error:', error.message);
      return null;
    }
  }

  /**
   * Get drug dynamic details (real-time pricing)
   */
  async getDrugDynamicDetails(drugSkuId: string, city: string = 'Delhi'): Promise<any> {
    try {
      const token = this.generateJWTToken();

      const response = await axios.get(
        `${this.baseUrl}/drug/${drugSkuId}/dynamic`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Platform': 'desktop',
            'X-City': city
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Dynamic details fetch error:', error.message);
      return null;
    }
  }

  /**
   * Check medicine inventory
   */
  async checkInventory(items: Array<{sku_id: string; quantity: number}>): Promise<any> {
    try {
      const token = this.generateJWTToken();

      const response = await axios.post(
        `${this.baseUrl}/inventory/check`,
        { items },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Platform': 'desktop',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Inventory check error:', error.message);
      return null;
    }
  }
}

// Usage
const config = {
  merchantId: 'YOUR_MERCHANT_ID',
  privateKey: 'YOUR_PRIVATE_KEY'
};

const client = new Tata1mgClient(config);

(async () => {
  const searchResults = await client.searchDrug('Paracetamol');
  console.log('Search Results:', searchResults);

  if (searchResults?.results?.[0]) {
    const drugDetails = await client.getDrugStaticDetails(
      searchResults.results[0].sku_id
    );
    console.log('Drug Details:', drugDetails);

    const dynamicDetails = await client.getDrugDynamicDetails(
      searchResults.results[0].sku_id,
      'Mumbai'
    );
    console.log('Pricing & Availability:', dynamicDetails);
  }
})();
```

---

### 3. CDSCO Approved Drugs Scraper

```python
# pip install requests beautifulsoup4 pandas

import requests
import pandas as pd
from datetime import datetime

class CDSCODrugsDownloader:
    """
    Download and parse CDSCO approved drugs lists
    """
    
    def __init__(self):
        self.base_url = "https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/"
        self.session = requests.Session()
    
    def get_approved_drugs_list(self, year: int) -> dict:
        """
        Get approved drugs list for specific year
        """
        year_list = {
            2025: "List of New Drugs approved in year 2025 to till date",
            2024: "List of new drugs approved in the year 2024 till date",
            2023: "List of new drugs approved in the year 2023 till date",
            # ... more years
        }
        
        # This would require PDF scraping from CDSCO website
        # PDFs are in format like:
        # - NewDrugs2024.pdf
        # - NewDrugs2023.pdf
        # etc.
        
        print(f"Downloading approved drugs list for {year}")
        # Implementation would involve PDF parsing
        return {}
    
    def parse_pdf_list(self, pdf_path: str) -> pd.DataFrame:
        """
        Parse PDF containing list of approved drugs
        """
        # Use pdfplumber or PyPDF2 to extract table data
        # Expected columns: Drug Name, Manufacturer, Approval Date, Category
        pass
    
    def get_essential_medicines_list(self) -> pd.DataFrame:
        """
        Get India's National List of Essential Medicines
        """
        # Available at: https://cdsco.gov.in/opencms/opencms/en/consumer/Essential-Medicines/
        # Returns DataFrame with essential medicines
        pass

# Usage
downloader = CDSCODrugsDownloader()
approved_2024 = downloader.get_approved_drugs_list(2024)
```

---

### 4. Unified Indian Medicine Search (Combined Sources)

```typescript
interface IndianMedicine {
  genericName: string;
  brandNames: string[];
  manufacturer: string;
  composition: string;
  dosageForm: string;
  strength: string;
  price?: number;
  mrp?: number;
  status: {
    approved_india: boolean;
    fda_approved?: boolean;
    ema_approved?: boolean;
  };
  uses: string[];
  sideEffects: string[];
  source: 'myupchar' | 'datarequisite' | 'cdsco' | '1mg';
}

class IndianMedicineSearch {
  private myupcharApiKey: string;
  private tata1mgConfig: any;

  constructor(apiKeys: {myupcharKey: string; tata1mgConfig: any}) {
    this.myupcharApiKey = apiKeys.myupcharKey;
    this.tata1mgConfig = apiKeys.tata1mgConfig;
  }

  /**
   * Search medicine across multiple Indian databases
   */
  async searchMedicine(medicineName: string): Promise<IndianMedicine[]> {
    const results: IndianMedicine[] = [];

    // Search myUpchar
    try {
      const myupcharResults = await this.searchMyUpchar(medicineName);
      results.push(...myupcharResults);
    } catch (error) {
      console.warn('myUpchar search failed:', error.message);
    }

    // Search 1mg (if merchant access available)
    try {
      const tata1mgResults = await this.searchTata1mg(medicineName);
      results.push(...tata1mgResults);
    } catch (error) {
      console.warn('Tata1mg search failed:', error.message);
    }

    // Deduplicate results
    return this.deduplicateResults(results);
  }

  private async searchMyUpchar(medicineName: string): Promise<IndianMedicine[]> {
    // Implementation using myUpchar API
    return [];
  }

  private async searchTata1mg(medicineName: string): Promise<IndianMedicine[]> {
    // Implementation using 1mg API with JWT token
    return [];
  }

  private deduplicateResults(results: IndianMedicine[]): IndianMedicine[] {
    const seen = new Map<string, IndianMedicine>();
    
    for (const medicine of results) {
      const key = `${medicine.genericName.toLowerCase()}_${medicine.strength}`;
      
      if (!seen.has(key)) {
        seen.set(key, medicine);
      } else {
        // Merge data from multiple sources
        const existing = seen.get(key)!;
        existing.brandNames = [...new Set([
          ...existing.brandNames,
          ...medicine.brandNames
        ])];
        if (medicine.price && !existing.price) {
          existing.price = medicine.price;
        }
      }
    }
    
    return Array.from(seen.values());
  }
}
```

---

## Data Coverage Comparison

| Database | Coverage | Brand Names | Price | Interactions | APIs | Cost |
|----------|----------|------------|-------|-------------|------|------|
| **DataRequisite** | 4.1L medicines | ✓ (30+ fields) | ✓ (updated) | Limited | ✓ (API) | Paid |
| **myUpchar** | 2L medicines | ✓ | ✓ | ✓ | ✓ (REST) | Free API* |
| **MedGuide** | 4L medicines | ✓ | Limited | Limited | App only | Free |
| **Tata 1mg** | 2L+ medicines | ✓ | ✓ (real-time) | ✓ | ✓ (JWT) | Merchant only |
| **CDSCO** | Approved drugs | ✓ | ✗ | Limited | ✗ | Free (PDFs) |
| **Practo** | Extensive | ✓ | ✓ | ✓ | Scrape only | Scraping cost |

*myUpchar: Check current API access policy

---

## Implementation Strategy

### Best Approach for Indian Medicine Encyclopedia

**Recommended Stack:**
1. **Primary**: DataRequisite (most comprehensive, 4.1L medicines, 30+ data points)
2. **Secondary**: myUpchar API (free/public, real-time pricing)
3. **Regulatory**: CDSCO approved drugs lists (PDFs, regulatory status)
4. **Backup**: MedGuide database (alternative medicines, distributor info)

**Integration Flow:**
```
User Search
    ↓
Check Local Cache (Redis)
    ↓
Query DataRequisite + myUpchar (parallel)
    ↓
Merge & Deduplicate
    ↓
Enrich with CDSCO approval status
    ↓
Add price/distributor from myUpchar
    ↓
Return unified results
```

### Data Points to Capture

**Minimum (for MVP):**
- Generic name (INN)
- Brand names (company-wise)
- Manufacturer
- Dosage form & strength
- Uses/indications
- Side effects
- Price/MRP

**Comprehensive (for full platform):**
- All above +
- Drug interactions
- Contraindications
- Dosage recommendations
- Storage conditions
- Shelf life
- Regulatory status (approved where)
- Distributor network
- Substitutes/alternatives
- Recent price changes

---

## Cost Analysis

| Solution | Monthly Cost | Setup | Best For |
|----------|-------------|-------|---------|
| myUpchar API | Free | Low | Startups, basic search |
| DataRequisite | Custom (₹10K-50K) | Medium | E-commerce, pharmacies |
| CDSCO + myUpchar | Free (PDFs + API) | Low | Regulatory compliance |
| Tata 1mg | Revenue share | High | Large platforms |
| Practo scraping | ₹5K-20K/month | High | Competitor analysis |

---

## Summary

**Best Free Option**: myUpchar API + CDSCO PDFs
- Coverage: 2L+ medicines
- Price info: Yes (myUpchar)
- Regulatory: Yes (CDSCO)
- No authentication needed for basic search

**Best Paid Option**: DataRequisite
- Coverage: 4.1L medicines
- 30+ data fields per medicine
- Regular price updates
- API access available

**For Production Indian Medicine Database**:
1. Contact DataRequisite for bulk database license
2. Integrate myUpchar API for real-time pricing
3. Import CDSCO approved drugs lists quarterly
4. Add MedGuide data for alternative search
5. Implement local database with Redis caching