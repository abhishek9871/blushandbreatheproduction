/**
 * Next.js API Route: /api/substances/openfda-interactions
 * 
 * Queries OpenFDA drug label API to find drug interactions from official FDA sources.
 * Extracts interaction information from the drug_interactions field of drug labels.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface DrugInteraction {
  severity: 'severe' | 'moderate' | 'mild' | 'unknown';
  description: string;
  mechanism?: string;
  management?: string;
  source: string;
  drugALabel?: string;
  drugBLabel?: string;
}

interface InteractionResponse {
  success: boolean;
  data: DrugInteraction[];
  drugA: string;
  drugB: string;
  error?: string;
  sources?: string[];
}

// Comprehensive known interactions database with severity ratings
// Source: Clinical pharmacology references, FDA labels, medical literature
const KNOWN_INTERACTIONS: Record<string, Record<string, DrugInteraction>> = {
  'warfarin': {
    'aspirin': {
      severity: 'severe',
      description: 'Concurrent use of Warfarin and Aspirin significantly increases the risk of major bleeding, including gastrointestinal and intracranial hemorrhage.',
      mechanism: 'Warfarin inhibits vitamin K-dependent clotting factors (II, VII, IX, X), while Aspirin irreversibly inhibits platelet cyclooxygenase, impairing platelet aggregation. The combination produces synergistic anticoagulant and antiplatelet effects.',
      management: 'Avoid combination unless specifically indicated (e.g., mechanical heart valve). If used together, use lowest effective aspirin dose (75-100mg), monitor INR frequently, and watch for signs of bleeding.',
      source: 'FDA Drug Label, Clinical Guidelines'
    },
    'ibuprofen': {
      severity: 'severe',
      description: 'NSAIDs including Ibuprofen can significantly increase the anticoagulant effect of Warfarin and substantially increase the risk of bleeding.',
      mechanism: 'Ibuprofen inhibits platelet function, may displace Warfarin from plasma protein binding sites, and can cause gastric mucosal damage. This results in both pharmacokinetic and pharmacodynamic interactions.',
      management: 'Avoid combination. Use acetaminophen as an alternative analgesic. If NSAID essential, use lowest dose for shortest duration, monitor INR closely, and consider gastroprotection.',
      source: 'FDA Drug Label'
    },
    'acetaminophen': {
      severity: 'moderate',
      description: 'High-dose or chronic acetaminophen use (>2g/day for several days) may enhance the anticoagulant effect of Warfarin.',
      mechanism: 'Acetaminophen may interfere with vitamin K-dependent clotting factor synthesis. The effect is dose-dependent and typically seen with doses >2g/day for more than 3-4 days.',
      management: 'Occasional use of acetaminophen is generally safe. For chronic use, limit to <2g/day and monitor INR. Acetaminophen remains the preferred analgesic for patients on Warfarin.',
      source: 'Clinical Studies, FDA Label'
    },
    'vitamin k': {
      severity: 'moderate',
      description: 'Vitamin K can decrease the anticoagulant effect of Warfarin, potentially leading to therapeutic failure.',
      mechanism: 'Vitamin K is essential for the synthesis of clotting factors II, VII, IX, and X. Supplementation or high dietary intake antagonizes Warfarin\'s mechanism of action.',
      management: 'Maintain consistent vitamin K intake. Avoid large fluctuations in vitamin K-rich foods (leafy greens). Avoid vitamin K supplements unless directed by physician.',
      source: 'FDA Drug Label'
    }
  },
  'aspirin': {
    'ibuprofen': {
      severity: 'moderate',
      description: 'Ibuprofen may interfere with the cardioprotective antiplatelet effect of low-dose aspirin.',
      mechanism: 'Ibuprofen competes with aspirin for binding to cyclooxygenase-1 (COX-1) on platelets. When taken before aspirin, ibuprofen blocks aspirin\'s irreversible inhibition of platelet aggregation.',
      management: 'If both needed, take aspirin at least 30 minutes before or 8 hours after ibuprofen. Consider alternative NSAIDs or acetaminophen for pain relief.',
      source: 'FDA Warning, Clinical Studies'
    },
    'methotrexate': {
      severity: 'severe',
      description: 'Aspirin may increase methotrexate toxicity by reducing its renal clearance.',
      mechanism: 'Salicylates compete with methotrexate for renal tubular secretion and may displace methotrexate from plasma protein binding sites, increasing free methotrexate levels.',
      management: 'Avoid combination with high-dose methotrexate. Monitor for methotrexate toxicity (myelosuppression, mucositis, hepatotoxicity). Consider alternative analgesics.',
      source: 'FDA Drug Label'
    }
  },
  'metformin': {
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol consumption with Metformin increases the risk of lactic acidosis, a rare but potentially fatal complication.',
      mechanism: 'Both alcohol and metformin affect hepatic lactate metabolism. Alcohol inhibits gluconeogenesis and can potentiate metformin\'s effect on lactate production.',
      management: 'Limit alcohol consumption. Avoid binge drinking. Patients should not take metformin if they consume excessive alcohol. Seek medical attention if symptoms of lactic acidosis occur.',
      source: 'FDA Black Box Warning'
    },
    'contrast dye': {
      severity: 'severe',
      description: 'Iodinated contrast media used in imaging procedures can cause acute kidney injury, which may lead to metformin accumulation and lactic acidosis.',
      mechanism: 'Contrast-induced nephropathy reduces renal clearance of metformin, leading to drug accumulation and increased risk of lactic acidosis.',
      management: 'Discontinue metformin before or at the time of contrast procedure. Resume 48 hours after procedure if renal function is stable.',
      source: 'FDA Drug Label, Radiology Guidelines'
    }
  },
  'sertraline': {
    'tramadol': {
      severity: 'severe',
      description: 'Concurrent use significantly increases the risk of serotonin syndrome, a potentially life-threatening condition.',
      mechanism: 'Both drugs increase serotonergic activity. Sertraline inhibits serotonin reuptake while tramadol has weak serotonin reuptake inhibition and may increase serotonin release.',
      management: 'Avoid combination if possible. If necessary, use lowest effective doses and monitor closely for serotonin syndrome symptoms: agitation, hyperthermia, tachycardia, tremor, hyperreflexia.',
      source: 'FDA Drug Label'
    },
    'triptans': {
      severity: 'moderate',
      description: 'SSRIs combined with triptans (sumatriptan, rizatriptan, etc.) may increase the risk of serotonin syndrome.',
      mechanism: 'Both drug classes affect serotonin neurotransmission, potentially leading to excessive serotonergic activity.',
      management: 'Use with caution. Monitor for serotonin syndrome symptoms, especially during treatment initiation or dose increases. Many patients tolerate this combination without issues.',
      source: 'FDA Safety Communication'
    },
    'maois': {
      severity: 'severe',
      description: 'Contraindicated combination. Concurrent use can cause severe serotonin syndrome, potentially fatal.',
      mechanism: 'MAOIs prevent the breakdown of serotonin while SSRIs prevent its reuptake, causing dangerous accumulation of serotonin.',
      management: 'Do not combine. Allow at least 14 days washout period between discontinuing an MAOI and starting sertraline, and at least 14 days after stopping sertraline before starting an MAOI.',
      source: 'FDA Contraindication'
    },
    'ibuprofen': {
      severity: 'moderate',
      description: 'Increased risk of bleeding, particularly gastrointestinal bleeding, when SSRIs are combined with NSAIDs.',
      mechanism: 'SSRIs inhibit platelet serotonin uptake, impairing platelet aggregation. NSAIDs cause gastric mucosal damage and also affect platelet function.',
      management: 'Use combination with caution. Consider gastroprotective therapy (PPI). Monitor for signs of bleeding. Use acetaminophen as alternative when possible.',
      source: 'Clinical Studies, FDA Label'
    }
  },
  'lisinopril': {
    'potassium': {
      severity: 'moderate',
      description: 'ACE inhibitors can increase serum potassium levels. Potassium supplements or potassium-sparing diuretics may cause hyperkalemia.',
      mechanism: 'ACE inhibitors reduce aldosterone secretion, decreasing potassium excretion. Additional potassium intake can lead to dangerous hyperkalemia.',
      management: 'Avoid potassium supplements unless prescribed. Monitor serum potassium regularly. Use caution with salt substitutes (often contain KCl).',
      source: 'FDA Drug Label'
    },
    'spironolactone': {
      severity: 'moderate',
      description: 'Both drugs can increase potassium levels, significantly increasing the risk of hyperkalemia.',
      mechanism: 'ACE inhibitors and spironolactone both reduce potassium excretion through different mechanisms, producing additive hyperkalemic effects.',
      management: 'Monitor potassium closely, especially in patients with renal impairment or diabetes. Start with low doses and titrate carefully.',
      source: 'FDA Drug Label, Clinical Guidelines'
    },
    'nsaids': {
      severity: 'moderate',
      description: 'NSAIDs may reduce the antihypertensive effect of ACE inhibitors and increase the risk of acute kidney injury.',
      mechanism: 'NSAIDs inhibit prostaglandin synthesis, which can reduce renal blood flow (especially in volume-depleted patients) and antagonize the vasodilatory effects of ACE inhibitors.',
      management: 'Monitor blood pressure and renal function when adding NSAIDs. Use lowest effective NSAID dose for shortest duration. Ensure adequate hydration.',
      source: 'FDA Drug Label'
    }
  },
  'simvastatin': {
    'amiodarone': {
      severity: 'severe',
      description: 'Amiodarone increases simvastatin levels, significantly increasing the risk of myopathy and rhabdomyolysis.',
      mechanism: 'Amiodarone inhibits CYP3A4 and OATP1B1, reducing simvastatin metabolism and increasing its plasma concentration.',
      management: 'Do not exceed simvastatin 20mg daily when used with amiodarone. Monitor for muscle symptoms. Consider alternative statins (pravastatin, rosuvastatin).',
      source: 'FDA Drug Label'
    },
    'grapefruit': {
      severity: 'moderate',
      description: 'Grapefruit juice can significantly increase simvastatin blood levels, increasing the risk of side effects including myopathy.',
      mechanism: 'Grapefruit inhibits intestinal CYP3A4, increasing simvastatin absorption and bioavailability.',
      management: 'Avoid grapefruit and grapefruit juice while taking simvastatin. If consuming grapefruit is important, consider switching to a statin less affected by CYP3A4.',
      source: 'FDA Drug Label'
    },
    'clarithromycin': {
      severity: 'severe',
      description: 'Strong CYP3A4 inhibitors like clarithromycin dramatically increase simvastatin levels, risking severe myopathy.',
      mechanism: 'Clarithromycin potently inhibits CYP3A4, the main enzyme responsible for simvastatin metabolism, causing significant drug accumulation.',
      management: 'Contraindicated combination. Suspend simvastatin during clarithromycin therapy or use an alternative antibiotic.',
      source: 'FDA Contraindication'
    }
  },
  'metoprolol': {
    'verapamil': {
      severity: 'severe',
      description: 'Concurrent use may cause severe bradycardia, heart block, and hypotension.',
      mechanism: 'Both drugs slow cardiac conduction. Beta-blockers and non-dihydropyridine calcium channel blockers have additive negative inotropic and chronotropic effects.',
      management: 'Avoid combination, especially in patients with conduction abnormalities. If necessary, use with extreme caution with close monitoring.',
      source: 'FDA Drug Label'
    },
    'diltiazem': {
      severity: 'severe',
      description: 'Similar to verapamil, diltiazem with metoprolol can cause significant bradycardia and cardiac conduction abnormalities.',
      mechanism: 'Additive effects on AV nodal conduction and negative inotropy.',
      management: 'Avoid combination unless specifically indicated and carefully monitored. Start with low doses if used together.',
      source: 'FDA Drug Label'
    }
  },
  'fluoxetine': {
    'tramadol': {
      severity: 'severe',
      description: 'Risk of serotonin syndrome and decreased tramadol efficacy.',
      mechanism: 'Fluoxetine inhibits CYP2D6, reducing conversion of tramadol to its active metabolite. Both drugs also increase serotonin levels.',
      management: 'Avoid combination. If pain management needed, consider alternative analgesics. Monitor for serotonin syndrome.',
      source: 'FDA Drug Label'
    },
    'maois': {
      severity: 'severe',
      description: 'Contraindicated. Fatal serotonin syndrome can occur.',
      mechanism: 'Extreme serotonin accumulation from combined inhibition of serotonin metabolism (MAOI) and reuptake (fluoxetine).',
      management: 'Do not combine. Allow 5 weeks after stopping fluoxetine before starting MAOI (due to long half-life of fluoxetine and norfluoxetine).',
      source: 'FDA Contraindication'
    }
  },
  'omeprazole': {
    'clopidogrel': {
      severity: 'moderate',
      description: 'Omeprazole may reduce the antiplatelet effect of clopidogrel, potentially decreasing its cardioprotective benefit.',
      mechanism: 'Omeprazole inhibits CYP2C19, which is required to convert clopidogrel to its active metabolite.',
      management: 'Consider alternative PPIs (pantoprazole) or H2 blockers. If omeprazole necessary, space doses 12 hours apart from clopidogrel.',
      source: 'FDA Warning'
    },
    'methotrexate': {
      severity: 'moderate',
      description: 'PPIs may increase methotrexate levels, potentially increasing toxicity.',
      mechanism: 'PPIs may reduce renal clearance of methotrexate by inhibiting renal H+/K+ ATPase.',
      management: 'Consider temporary PPI discontinuation with high-dose methotrexate. Monitor for methotrexate toxicity.',
      source: 'FDA Drug Label'
    }
  },
  'alprazolam': {
    'ketoconazole': {
      severity: 'severe',
      description: 'Ketoconazole significantly increases alprazolam levels, potentially causing excessive sedation and respiratory depression.',
      mechanism: 'Ketoconazole is a potent CYP3A4 inhibitor. Alprazolam is primarily metabolized by CYP3A4.',
      management: 'Contraindicated combination. Use alternative antifungal or benzodiazepine (lorazepam, oxazepam).',
      source: 'FDA Contraindication'
    },
    'opioids': {
      severity: 'severe',
      description: 'Concurrent use of benzodiazepines and opioids can result in profound sedation, respiratory depression, coma, and death.',
      mechanism: 'Both drug classes depress the central nervous system. Effects are synergistic rather than simply additive.',
      management: 'Avoid combination when possible. If combination necessary, use lowest effective doses and shortest duration. Monitor closely for respiratory depression.',
      source: 'FDA Black Box Warning'
    },
    'alcohol': {
      severity: 'severe',
      description: 'Alcohol potentiates the CNS depressant effects of alprazolam, increasing sedation and risk of respiratory depression.',
      mechanism: 'Both enhance GABA-mediated inhibition in the CNS.',
      management: 'Avoid alcohol while taking alprazolam. Warn patients about increased sedation risk.',
      source: 'FDA Drug Label'
    }
  },
  'gabapentin': {
    'opioids': {
      severity: 'severe',
      description: 'Gabapentin combined with opioids increases risk of CNS depression, respiratory depression, and overdose death.',
      mechanism: 'Both drugs cause CNS depression through different mechanisms that combine synergistically.',
      management: 'Use combination only when necessary. Start with lower opioid doses. Monitor closely for sedation and respiratory depression.',
      source: 'FDA Warning'
    },
    'antacids': {
      severity: 'mild',
      description: 'Antacids containing aluminum or magnesium can reduce gabapentin absorption.',
      mechanism: 'Antacids bind to gabapentin in the GI tract, reducing its bioavailability.',
      management: 'Take gabapentin at least 2 hours after antacids.',
      source: 'FDA Drug Label'
    }
  },
  'levothyroxine': {
    'calcium': {
      severity: 'mild',
      description: 'Calcium supplements can reduce levothyroxine absorption, potentially leading to hypothyroidism.',
      mechanism: 'Calcium binds to levothyroxine in the GI tract, forming insoluble complexes that reduce absorption.',
      management: 'Separate levothyroxine and calcium by at least 4 hours. Take levothyroxine on empty stomach, calcium with meals.',
      source: 'FDA Drug Label'
    },
    'iron': {
      severity: 'mild',
      description: 'Iron supplements reduce levothyroxine absorption.',
      mechanism: 'Iron binds to levothyroxine, reducing its bioavailability.',
      management: 'Separate by at least 4 hours. Monitor TSH levels when starting or stopping iron supplements.',
      source: 'FDA Drug Label'
    },
    'proton pump inhibitors': {
      severity: 'mild',
      description: 'PPIs may reduce levothyroxine absorption by increasing gastric pH.',
      mechanism: 'Levothyroxine requires acidic environment for optimal dissolution and absorption.',
      management: 'Monitor TSH when starting PPIs. May need levothyroxine dose adjustment.',
      source: 'Clinical Studies'
    }
  }
};

// Drug name aliases for better matching
const DRUG_ALIASES: Record<string, string[]> = {
  'warfarin': ['coumadin', 'jantoven'],
  'aspirin': ['asa', 'acetylsalicylic acid', 'bayer'],
  'ibuprofen': ['advil', 'motrin', 'nurofen'],
  'acetaminophen': ['tylenol', 'paracetamol', 'apap'],
  'metformin': ['glucophage', 'glumetza', 'fortamet'],
  'sertraline': ['zoloft'],
  'fluoxetine': ['prozac', 'sarafem'],
  'lisinopril': ['prinivil', 'zestril'],
  'metoprolol': ['lopressor', 'toprol'],
  'simvastatin': ['zocor'],
  'atorvastatin': ['lipitor'],
  'omeprazole': ['prilosec'],
  'alprazolam': ['xanax'],
  'gabapentin': ['neurontin', 'gralise'],
  'tramadol': ['ultram', 'conzip'],
  'levothyroxine': ['synthroid', 'levoxyl', 'tirosint'],
  'clopidogrel': ['plavix'],
  'losartan': ['cozaar'],
  'amlodipine': ['norvasc'],
  'hydrochlorothiazide': ['hctz', 'microzide'],
  'prednisone': ['deltasone', 'rayos'],
  'duloxetine': ['cymbalta'],
  'escitalopram': ['lexapro'],
  'trazodone': ['desyrel'],
  'pantoprazole': ['protonix'],
  'furosemide': ['lasix']
};

function normalizeDrugName(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Check if it's an alias
  for (const [generic, aliases] of Object.entries(DRUG_ALIASES)) {
    if (aliases.includes(lower) || lower === generic) {
      return generic;
    }
  }
  
  return lower;
}

/**
 * Clean raw FDA text by removing section headers and references
 */
function cleanRawFDAText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove section numbers at the start like "7 DRUG INTERACTIONS" or "7.1 Effects..."
  cleaned = cleaned.replace(/^\s*\d+(\.\d+)?\s*(DRUG INTERACTIONS|Drug Interactions)\s*/gi, '');
  
  // Remove inline section numbers like "7.1 " 
  cleaned = cleaned.replace(/\d+(\.\d+)?\s+(?=[A-Z])/g, '');
  
  // Remove subsection headers like "Effects of X on Y Substrates"
  cleaned = cleaned.replace(/Effects?\s+of\s+\w+\s+on\s+[A-Z0-9/]+\s+(Substrates?|Inhibitors?|Inducers?)?\s*/gi, '');
  
  // Clean up "[see Clinical Pharmacology (12.3)]" references
  cleaned = cleaned.replace(/\[see\s+[^\]]+\]/gi, '');
  
  // Clean up standalone "(12.3)" style references  
  cleaned = cleaned.replace(/\(\s*\d+(\.\d+)?\s*\)/g, '');
  
  // Clean up " / " with just "/"
  cleaned = cleaned.replace(/\s+\/\s+/g, '/');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Clean and format FDA label text for better readability
 */
function cleanFDAText(text: string, targetDrug: string): string {
  if (!text) return '';
  
  // First apply raw text cleaning
  let cleaned = cleanRawFDAText(text);
  
  // Try to extract sentences that mention the target drug or relevant topics
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const relevantSentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes(targetDrug.toLowerCase()) ||
      lower.includes('interaction') ||
      lower.includes('concomitant') ||
      lower.includes('co-administ') ||
      lower.includes('clearance') ||
      lower.includes('metabolism') ||
      lower.includes('exposure') ||
      lower.includes('induction') ||
      lower.includes('inhibit');
  });
  
  if (relevantSentences.length > 0) {
    // Take up to 4 relevant sentences
    return relevantSentences.slice(0, 4).join(' ').trim();
  }
  
  // If no relevant sentences found, take first 3 sentences
  if (sentences.length > 3) {
    return sentences.slice(0, 3).join(' ').trim();
  }
  
  // Truncate if still too long
  if (cleaned.length > 600) {
    return cleaned.substring(0, 600).trim() + '...';
  }
  
  return cleaned;
}

/**
 * Extract management advice from FDA text
 */
function extractManagement(text: string): string | undefined {
  // First clean the text
  const cleanedText = cleanRawFDAText(text);
  
  // Look for management-related sentences
  const sentences = cleanedText.split(/(?<=[.!?])\s+/);
  const managementKeywords = ['dosage adjustment', 'should be considered', 'recommend', 'consider', 'monitor', 'avoid', 'caution', 'reduce', 'increase', 'alternative'];
  
  const managementSentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    return managementKeywords.some(kw => lower.includes(kw));
  });
  
  if (managementSentences.length > 0) {
    // Clean and return up to 2 sentences
    return managementSentences.slice(0, 2).join(' ').trim();
  }
  
  return undefined;
}

function checkLocalInteraction(drugA: string, drugB: string): DrugInteraction | null {
  const normalizedA = normalizeDrugName(drugA);
  const normalizedB = normalizeDrugName(drugB);
  
  // Check both directions
  let interaction = KNOWN_INTERACTIONS[normalizedA]?.[normalizedB] ||
                   KNOWN_INTERACTIONS[normalizedB]?.[normalizedA];
  
  if (interaction) {
    return interaction;
  }
  
  // Check for class-based interactions
  const nsaids = ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'celecoxib', 'indomethacin'];
  const ssris = ['sertraline', 'fluoxetine', 'paroxetine', 'escitalopram', 'citalopram', 'fluvoxamine'];
  const opioids = ['tramadol', 'hydrocodone', 'oxycodone', 'morphine', 'codeine', 'fentanyl'];
  const benzodiazepines = ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'temazepam'];
  const statins = ['simvastatin', 'atorvastatin', 'lovastatin', 'pravastatin', 'rosuvastatin'];
  const aceInhibitors = ['lisinopril', 'enalapril', 'ramipril', 'captopril', 'benazepril'];
  
  // SSRI + NSAID interaction
  if ((ssris.includes(normalizedA) && nsaids.includes(normalizedB)) ||
      (nsaids.includes(normalizedA) && ssris.includes(normalizedB))) {
    return KNOWN_INTERACTIONS['sertraline']?.['ibuprofen'];
  }
  
  // Benzodiazepine + Opioid interaction
  if ((benzodiazepines.includes(normalizedA) && opioids.includes(normalizedB)) ||
      (opioids.includes(normalizedA) && benzodiazepines.includes(normalizedB))) {
    return KNOWN_INTERACTIONS['alprazolam']?.['opioids'];
  }
  
  // ACE Inhibitor + NSAID interaction
  if ((aceInhibitors.includes(normalizedA) && nsaids.includes(normalizedB)) ||
      (nsaids.includes(normalizedA) && aceInhibitors.includes(normalizedB))) {
    return KNOWN_INTERACTIONS['lisinopril']?.['nsaids'];
  }
  
  return null;
}

async function queryOpenFDA(drugA: string, drugB: string): Promise<DrugInteraction | null> {
  try {
    // Query OpenFDA for drug labels mentioning both drugs in the interactions section
    const searchTermA = encodeURIComponent(drugA);
    const searchTermB = encodeURIComponent(drugB);
    
    // Search for drug A's label and check its drug_interactions field
    const urlA = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${searchTermA}"+drug_interactions:"${searchTermB}"&limit=3`;
    
    const responseA = await fetch(urlA);
    
    if (responseA.ok) {
      const dataA = await responseA.json();
      
      if (dataA.results && dataA.results.length > 0) {
        for (const result of dataA.results) {
          const interactionText = result.drug_interactions?.[0] || '';
          
          if (interactionText && interactionText.toLowerCase().includes(drugB.toLowerCase())) {
            // Parse the interaction text for severity indicators
            let severity: DrugInteraction['severity'] = 'unknown';
            const textLower = interactionText.toLowerCase();
            
            if (textLower.includes('contraindicated') || 
                textLower.includes('do not use') ||
                textLower.includes('should not be used') ||
                textLower.includes('fatal') ||
                textLower.includes('life-threatening')) {
              severity = 'severe';
            } else if (textLower.includes('caution') ||
                       textLower.includes('monitor') ||
                       textLower.includes('may increase') ||
                       textLower.includes('may decrease') ||
                       textLower.includes('risk of')) {
              severity = 'moderate';
            } else if (textLower.includes('minor') ||
                       textLower.includes('unlikely') ||
                       textLower.includes('theoretical')) {
              severity = 'mild';
            }
            
            // Clean and format the interaction text
            const cleanedText = cleanFDAText(interactionText, drugB);
            const management = extractManagement(interactionText);
            
            return {
              severity,
              description: cleanedText || `Potential interaction between ${drugA} and ${drugB}. Please consult your healthcare provider for specific guidance.`,
              mechanism: interactionText.toLowerCase().includes('cyp') || interactionText.toLowerCase().includes('enzyme') 
                ? 'This interaction involves drug metabolism enzymes (cytochrome P450 system).'
                : undefined,
              management: management || 'Consult your healthcare provider or pharmacist for personalized dosing recommendations.',
              source: 'FDA Drug Label (OpenFDA)',
              drugALabel: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || drugA
            };
          }
        }
      }
    }
    
    // Try the reverse search
    const urlB = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${searchTermB}"+drug_interactions:"${searchTermA}"&limit=3`;
    
    const responseB = await fetch(urlB);
    
    if (responseB.ok) {
      const dataB = await responseB.json();
      
      if (dataB.results && dataB.results.length > 0) {
        for (const result of dataB.results) {
          const interactionText = result.drug_interactions?.[0] || '';
          
          if (interactionText && interactionText.toLowerCase().includes(drugA.toLowerCase())) {
            let severity: DrugInteraction['severity'] = 'unknown';
            const textLower = interactionText.toLowerCase();
            
            if (textLower.includes('contraindicated') || 
                textLower.includes('do not use') ||
                textLower.includes('should not be used')) {
              severity = 'severe';
            } else if (textLower.includes('caution') ||
                       textLower.includes('monitor') ||
                       textLower.includes('may increase') ||
                       textLower.includes('may decrease')) {
              severity = 'moderate';
            } else if (textLower.includes('minor') ||
                       textLower.includes('unlikely')) {
              severity = 'mild';
            }
            
            // Clean and format the interaction text
            const cleanedText = cleanFDAText(interactionText, drugA);
            const management = extractManagement(interactionText);
            
            return {
              severity,
              description: cleanedText || `Potential interaction between ${drugA} and ${drugB}. Please consult your healthcare provider for specific guidance.`,
              mechanism: interactionText.toLowerCase().includes('cyp') || interactionText.toLowerCase().includes('enzyme')
                ? 'This interaction involves drug metabolism enzymes (cytochrome P450 system).'
                : undefined,
              management: management || 'Consult your healthcare provider or pharmacist for personalized dosing recommendations.',
              source: 'FDA Drug Label (OpenFDA)',
              drugBLabel: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || drugB
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('OpenFDA query error:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InteractionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: [],
      drugA: '',
      drugB: '',
      error: 'Method not allowed'
    });
  }

  const { drugA, drugB } = req.query;

  if (!drugA || !drugB || typeof drugA !== 'string' || typeof drugB !== 'string') {
    return res.status(400).json({
      success: false,
      data: [],
      drugA: String(drugA || ''),
      drugB: String(drugB || ''),
      error: 'Both drugA and drugB parameters are required'
    });
  }

  const drugAClean = drugA.trim();
  const drugBClean = drugB.trim();

  // Set cache headers
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    const sources: string[] = [];
    
    // First check our local database (most reliable, curated data)
    const localInteraction = checkLocalInteraction(drugAClean, drugBClean);
    
    if (localInteraction) {
      sources.push('Curated Clinical Database');
      return res.status(200).json({
        success: true,
        data: [localInteraction],
        drugA: drugAClean,
        drugB: drugBClean,
        sources
      });
    }
    
    // Query OpenFDA for interaction data
    const fdaInteraction = await queryOpenFDA(drugAClean, drugBClean);
    
    if (fdaInteraction) {
      sources.push('FDA Drug Label');
      return res.status(200).json({
        success: true,
        data: [fdaInteraction],
        drugA: drugAClean,
        drugB: drugBClean,
        sources
      });
    }
    
    // No interaction found
    return res.status(200).json({
      success: true,
      data: [{
        severity: 'unknown',
        description: `No documented drug interaction found between ${drugAClean} and ${drugBClean}. However, the absence of documented interactions does not guarantee safety. Drug interactions can be complex and may depend on individual factors such as dose, duration, and patient health status.`,
        management: 'Always consult your healthcare provider or pharmacist before combining medications. They can provide personalized advice based on your complete medication list and health history.',
        source: 'No interaction data available'
      }],
      drugA: drugAClean,
      drugB: drugBClean,
      sources: ['No matches in database']
    });

  } catch (error) {
    console.error('Interaction API error:', error);
    return res.status(500).json({
      success: false,
      data: [],
      drugA: drugAClean,
      drugB: drugBClean,
      error: 'Failed to check drug interactions. Please try again.'
    });
  }
}
