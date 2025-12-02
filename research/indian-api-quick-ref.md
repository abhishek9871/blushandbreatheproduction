# Indian Medicine APIs: Quick Start & Code Examples

## Quick API References

### 1. myUpchar Medicine API (Free & Public)

**Base URL**: `https://beta.myupchar.com/api/medicine`

**Endpoints**:
```bash
# Search medicines
GET /search?api_key=KEY&name=MEDICINE_NAME&type=Allopath

# Get by category
GET /search?api_key=KEY&category_id=CATEGORY_ID&page=1

# Search by manufacturer
GET /search?api_key=KEY&manufacturer=MANUFACTURER&page=1
```

**Medicine Types**:
- Allopath (modern medicine)
- Ayurveda (traditional Indian)
- Homeopath (homeopathic)
- Unani (Unani medicine)
- General (OTC items)

**cURL Examples**:
```bash
# Search for Paracetamol
curl -X GET "https://beta.myupchar.com/api/medicine/search?api_key=YOUR_API_KEY&name=Paracetamol&type=Allopath"

# Search Sun Pharma medicines
curl -X GET "https://beta.myupchar.com/api/medicine/search?api_key=YOUR_API_KEY&manufacturer=Sun%20Pharma"

# Pagination
curl -X GET "https://beta.myupchar.com/api/medicine/search?api_key=YOUR_API_KEY&name=Aspirin&page=2"
```

**JavaScript Fetch Example**:
```javascript
async function searchMedicine(medicineName, apiKey) {
  const params = new URLSearchParams({
    api_key: apiKey,
    name: medicineName,
    type: 'Allopath',
    page: 1
  });

  const response = await fetch(
    `https://beta.myupchar.com/api/medicine/search?${params}`
  );
  
  const data = await response.json();
  return data;
}

// Usage
const medicines = await searchMedicine('Paracetamol', 'YOUR_API_KEY');
console.log(medicines);
```

**Python Example**:
```python
import requests

API_KEY = 'YOUR_API_KEY'
BASE_URL = 'https://beta.myupchar.com/api/medicine'

def search_medicine(name, medicine_type='Allopath', page=1):
    params = {
        'api_key': API_KEY,
        'name': name,
        'type': medicine_type,
        'page': page
    }
    
    response = requests.get(f'{BASE_URL}/search', params=params)
    return response.json()

# Usage
result = search_medicine('Paracetamol')
for medicine in result.get('medicines', []):
    print(f"{medicine['name']} - {medicine['manufacturer']}")
```

---

### 2. Tata 1mg Merchant API (Requires Partnership)

**Authentication**: JWT Token

```typescript
// Generate JWT Token
import jwt from 'jsonwebtoken';

function generateToken(merchantId: string, privateKey: string): string {
  const payload = {
    merchant_id: merchantId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  return jwt.sign(payload, privateKey, { algorithm: 'HS256' });
}

// Make API call with JWT
import axios from 'axios';

async function searchDrug(drugName: string, token: string) {
  const response = await axios.get(
    'https://api.1mg.com/v1/search',
    {
      params: { query: drugName },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Platform': 'desktop',
        'X-City': 'Delhi'
      }
    }
  );
  
  return response.data;
}

// Usage
const token = generateToken('MERCHANT_ID', 'PRIVATE_KEY');
const results = await searchDrug('Aspirin', token);
```

---

### 3. CDSCO Approved Drugs (Free, PDF Download)

```python
import requests
import pandas as pd
import pdfplumber

class CDSCODrugFetcher:
    BASE_URL = 'https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/'
    
    PDF_URLS = {
        2025: 'https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/documents/List_of_New_Drugs_approved_in_year_2025_to_till_date.pdf',
        2024: 'https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/documents/List_of_new_drugs_approved_in_the_year_2024_till_date.pdf',
        # Add more years as needed
    }
    
    @staticmethod
    def download_pdf(year: int, save_path: str = None) -> bytes:
        """Download approved drugs list PDF for specific year"""
        if year not in CDSCODrugFetcher.PDF_URLS:
            raise ValueError(f'Year {year} not available')
        
        url = CDSCODrugFetcher.PDF_URLS[year]
        response = requests.get(url)
        response.raise_for_status()
        
        if save_path:
            with open(save_path, 'wb') as f:
                f.write(response.content)
        
        return response.content
    
    @staticmethod
    def parse_pdf(pdf_path: str) -> pd.DataFrame:
        """Parse PDF and extract drug information"""
        drugs = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) >= 3:
                            drugs.append({
                                'drug_name': row[0],
                                'manufacturer': row[1] if len(row) > 1 else '',
                                'approval_date': row[2] if len(row) > 2 else '',
                                'category': row[3] if len(row) > 3 else ''
                            })
        
        return pd.DataFrame(drugs)

# Usage
fetcher = CDSCODrugFetcher()

# Download
fetcher.download_pdf(2024, 'approved_drugs_2024.pdf')

# Parse
df = fetcher.parse_pdf('approved_drugs_2024.pdf')
print(df.head())

# Query
paracetamol_entries = df[df['drug_name'].str.contains('Paracetamol', case=False)]
print(paracetamol_entries)
```

---

### 4. DataRequisite Integration (Excel/CSV)

```python
import pandas as pd

class DataRequisiteMedicineDB:
    """
    DataRequisite provides medicine database in Excel format
    30+ data points per medicine
    """
    
    def __init__(self, excel_file_path: str):
        self.df = pd.read_excel(excel_file_path)
    
    def search_by_name(self, medicine_name: str) -> pd.DataFrame:
        """Search medicine by name (generic or brand)"""
        return self.df[
            self.df['Medicine_Name'].str.contains(medicine_name, case=False, na=False)
        ]
    
    def search_by_manufacturer(self, manufacturer: str) -> pd.DataFrame:
        """Get all medicines from specific manufacturer"""
        return self.df[
            self.df['Manufacturer'].str.contains(manufacturer, case=False, na=False)
        ]
    
    def search_by_salt(self, salt_name: str) -> pd.DataFrame:
        """Search medicines by active ingredient/salt"""
        return self.df[
            self.df['Salt_Content'].str.contains(salt_name, case=False, na=False)
        ]
    
    def get_alternatives(self, medicine_name: str) -> pd.DataFrame:
        """Find alternative medicines with same salt/composition"""
        original = self.search_by_name(medicine_name)
        if original.empty:
            return pd.DataFrame()
        
        salt = original.iloc[0]['Salt_Content']
        return self.search_by_salt(salt).drop(original.index)
    
    def filter_by_price_range(self, min_price: float, max_price: float) -> pd.DataFrame:
        """Filter medicines by price range"""
        return self.df[
            (self.df['MRP'] >= min_price) & 
            (self.df['MRP'] <= max_price)
        ]
    
    def get_medicine_info(self, medicine_name: str) -> dict:
        """Get comprehensive info for single medicine"""
        result = self.search_by_name(medicine_name)
        if result.empty:
            return None
        
        medicine = result.iloc[0].to_dict()
        return {
            'name': medicine.get('Medicine_Name'),
            'manufacturer': medicine.get('Manufacturer'),
            'salt': medicine.get('Salt_Content'),
            'dosage_form': medicine.get('Dosage_Form'),
            'strength': medicine.get('Strength'),
            'package_size': medicine.get('Pack_Size'),
            'mrp': medicine.get('MRP'),
            'image_url': medicine.get('Image_URL'),
            'regulatory_status': medicine.get('Regulatory_Status'),
            'storage': medicine.get('Storage_Conditions')
        }

# Usage
db = DataRequisiteMedicineDB('indian_medicines_database.xlsx')

# Search by name
paracetamol = db.search_by_name('Paracetamol')
print(paracetamol[['Medicine_Name', 'Manufacturer', 'MRP']])

# Get alternatives
alternatives = db.get_alternatives('Crocin')
print('Alternative to Crocin:', alternatives['Medicine_Name'].values)

# Filter by price
cheap_medicines = db.filter_by_price_range(0, 50)
print(f'Found {len(cheap_medicines)} medicines under ₹50')

# Get full info
info = db.get_medicine_info('Aspirin 500mg')
print(info)
```

---

### 5. Comprehensive Search Across Multiple Sources

```javascript
// npm install axios dotenv

require('dotenv').config();

const myUpcharKey = process.env.MYUPCHAR_API_KEY;
const dataRequisiteFile = process.env.DATA_REQUISITE_FILE;

class IndianMedicineAggregator {
  constructor() {
    this.sources = [];
  }

  /**
   * Search medicine across all available sources
   */
  async searchMedicine(medicineName) {
    console.log(`Searching for: ${medicineName}`);

    const results = {
      myupchar: await this.searchMyUpchar(medicineName),
      cdsco: await this.searchCDSCO(medicineName),
      local: await this.searchLocalDB(medicineName)
    };

    return this.consolidateResults(results);
  }

  /**
   * Search myUpchar API
   */
  async searchMyUpchar(medicineName) {
    try {
      const response = await fetch(
        `https://beta.myupchar.com/api/medicine/search?api_key=${myUpcharKey}&name=${medicineName}`
      );
      return await response.json();
    } catch (error) {
      console.warn('myUpchar search failed:', error.message);
      return { medicines: [] };
    }
  }

  /**
   * Search CDSCO approved drugs (from cached PDF data)
   */
  async searchCDSCO(medicineName) {
    // This would search a local database populated from CDSCO PDFs
    // For demo, returning empty
    return { approved_drugs: [] };
  }

  /**
   * Search local DataRequisite database
   */
  async searchLocalDB(medicineName) {
    // This would query local database/cache
    return { medicines: [] };
  }

  /**
   * Consolidate and deduplicate results
   */
  consolidateResults(results) {
    const consolidated = new Map();

    // Process myUpchar results
    if (results.myupchar.medicines) {
      results.myupchar.medicines.forEach(medicine => {
        const key = `${medicine.name.toLowerCase()}_${medicine.strength}`;
        if (!consolidated.has(key)) {
          consolidated.set(key, {
            name: medicine.name,
            strength: medicine.strength,
            manufacturer: medicine.manufacturer,
            sources: ['myupchar'],
            price: medicine.price,
            uses: medicine.uses,
            sideEffects: medicine.side_effects
          });
        } else {
          consolidated.get(key).sources.push('myupchar');
        }
      });
    }

    // Process CDSCO results
    if (results.cdsco.approved_drugs) {
      results.cdsco.approved_drugs.forEach(drug => {
        const key = `${drug.name.toLowerCase()}_${drug.strength}`;
        if (consolidated.has(key)) {
          consolidated.get(key).sources.push('cdsco');
          consolidated.get(key).approved_in_india = true;
        }
      });
    }

    return Array.from(consolidated.values());
  }

  /**
   * Get alternatives/substitutes
   */
  async getAlternatives(medicineName) {
    const medicine = await this.searchMedicine(medicineName);
    if (!medicine || medicine.length === 0) return [];

    const salt = medicine[0].salt_content;
    return await this.searchMedicine(salt);
  }
}

// Usage
const aggregator = new IndianMedicineAggregator();

(async () => {
  const results = await aggregator.searchMedicine('Paracetamol');
  console.log('Unified Results:', results);

  const alternatives = await aggregator.getAlternatives('Crocin');
  console.log('Alternatives:', alternatives);
})();
```

---

## Data Fields Available

### From myUpchar API:
```json
{
  "id": "123456",
  "name": "Paracetamol 500mg",
  "strength": "500mg",
  "dosage_form": "Tablet",
  "manufacturer": "Paracetamol Pharma",
  "salt_content": "Paracetamol",
  "category": "Antipyretic & Analgesic",
  "type": "Allopath",
  "uses": ["Fever", "Pain", "Headache"],
  "side_effects": ["Allergic reaction", "Liver damage"],
  "contraindications": [],
  "dosage": "1 tablet twice daily",
  "price": 45,
  "rating": 4.5,
  "alternatives": ["Crocin", "Dolophen"]
}
```

### From DataRequisite:
```
30+ fields including:
- Medicine Name (Brand + Generic)
- INN/Salt
- Manufacturer
- Dosage Form & Strength
- Pack Size
- MRP
- Manufacturing Date
- Expiry Date
- Images
- Regulatory Status
- Storage Conditions
- Uses
- Side Effects
- Contraindications
- Drug Interactions
- Barcode
- Distributor Details
- And more...
```

### From CDSCO:
```
- Drug Name (Generic)
- Brand Names
- Manufacturer
- Approval Date
- Division (New Drug, SND, Biological, etc.)
- Category (Single, FDC)
- Type (BD, FF, Both)
- Therapeutic Class
- Drug Classification
```

---

## Environment Setup

**.env file:**
```
MYUPCHAR_API_KEY=your_api_key_here
DATA_REQUISITE_FILE=/path/to/database.xlsx
CDSCO_CACHE_DIR=/path/to/cdsco/cache
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/medicines_db
```

---

## Rate Limiting & Best Practices

**myUpchar API:**
- No published rate limit
- Recommended: Max 10 requests/second
- Cache results for 24 hours

**Tata 1mg API:**
- JWT token expiry: 1 hour
- Recommended: Re-generate token per session
- Use merchant-specific rate limits

**CDSCO PDFs:**
- Update frequency: Annual (new drugs list)
- Download once, cache locally
- Use as reference/backup

**Local caching strategy:**
```javascript
const Cache = require('node-cache');

// Cache medicines for 24 hours
const medicineCache = new Cache({ stdTTL: 86400 });

async function getCachedMedicine(name) {
  const cached = medicineCache.get(name);
  if (cached) return cached;

  const result = await searchMedicine(name);
  medicineCache.set(name, result);
  return result;
}
```

---

## Summary of Sources

| Source | Coverage | Cost | Best For |
|--------|----------|------|----------|
| **myUpchar** | 2L medicines | Free | Real-time pricing, general search |
| **DataRequisite** | 4.1L medicines | Paid | Comprehensive encyclopedia |
| **CDSCO** | Approved drugs | Free | Regulatory compliance |
| **Tata 1mg** | 2L+ medicines | Merchant | Integrated pharmacy platform |
| **MedGuide** | 4L medicines | Free (app) | Alternative medicine search |

**Recommended for New Platform**: Start with myUpchar free API + CDSCO PDFs + local DataRequisite database cache.