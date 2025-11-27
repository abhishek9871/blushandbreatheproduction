/**
 * Indian Medicine Search API
 * 
 * Searches the 254K Indian medicines database
 * Route: /api/indian-medicine/[name]
 * Example: /api/indian-medicine/crocin
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface IndianMedicine {
  id: string;
  name: string;
  baseName: string;
  price: number;
  manufacturer: string;
  type: string;
  packSize: string;
  composition1: string;
  composition2: string;
  isDiscontinued: boolean;
}

// Cache the medicines data in memory after first load
let medicinesCache: IndianMedicine[] | null = null;
let indexCache: Record<string, string[]> | null = null;

function loadMedicines(): IndianMedicine[] {
  if (medicinesCache) return medicinesCache;
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'indian-medicines.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    medicinesCache = JSON.parse(data);
    return medicinesCache!;
  } catch (error) {
    console.error('Failed to load medicines:', error);
    return [];
  }
}

function loadIndex(): Record<string, string[]> {
  if (indexCache) return indexCache;
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'indian-medicines-index.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    indexCache = JSON.parse(data);
    return indexCache!;
  } catch (error) {
    console.error('Failed to load index:', error);
    return {};
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function searchMedicine(searchTerm: string): IndianMedicine | null {
  const medicines = loadMedicines();
  const normalized = normalizeName(searchTerm);
  
  // Exact match on base name first
  let match = medicines.find(m => 
    normalizeName(m.baseName) === normalized ||
    normalizeName(m.name) === normalized
  );
  
  if (match) return match;
  
  // Partial match on name
  match = medicines.find(m => 
    normalizeName(m.name).includes(normalized) ||
    normalizeName(m.baseName).includes(normalized)
  );
  
  if (match) return match;
  
  // Match on composition
  match = medicines.find(m => {
    const comp1 = normalizeName(m.composition1.replace(/\([^)]+\)/g, ''));
    return comp1.includes(normalized) || normalized.includes(comp1.split(' ')[0]);
  });
  
  return match || null;
}

function searchMedicinesList(searchTerm: string, limit: number = 10): IndianMedicine[] {
  const medicines = loadMedicines();
  const normalized = normalizeName(searchTerm);
  
  const results: IndianMedicine[] = [];
  
  for (const med of medicines) {
    if (results.length >= limit) break;
    
    const nameMatch = normalizeName(med.name).includes(normalized) ||
                      normalizeName(med.baseName).includes(normalized);
    const compMatch = normalizeName(med.composition1).includes(normalized);
    
    if (nameMatch || compMatch) {
      results.push(med);
    }
  }
  
  return results;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, list } = req.query;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Medicine name is required' });
  }
  
  try {
    // If list=true, return multiple results
    if (list === 'true') {
      const results = searchMedicinesList(name, 20);
      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    }
    
    // Otherwise, return single best match
    const medicine = searchMedicine(name);
    
    if (medicine) {
      return res.status(200).json({
        success: true,
        data: medicine
      });
    } else {
      return res.status(404).json({
        success: false,
        error: `Medicine "${name}" not found in Indian database`
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
