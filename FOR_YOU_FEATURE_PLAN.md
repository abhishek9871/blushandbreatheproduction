# "For You" Feature - AI-Powered Personalized Diet Chart System

## 📋 Executive Summary

Transform the "For You" tab into a **center-stage AI-powered diet chart creator** that provides real, personalized value to users. This feature will use **free AI APIs** to generate professional-grade diet plans tailored to each user's unique body metrics, goals, and preferences.

---

## 🔍 Current State Analysis

### What Exists:
| Component | Status | Limitation |
|-----------|--------|------------|
| `ProfileSetup.tsx` | Basic setup wizard | Missing weight, height, age, gender |
| `useUserProfile.tsx` | Simple rule-based engine | No calorie calculation, no AI |
| `PersonalizedRecommendations.tsx` | Basic food suggestions | Not a proper diet chart |

### What's Missing for a Real Diet Chart:
1. **User physical data** - weight, height, age, gender
2. **Scientific calorie calculation** - BMR, TDEE
3. **Macro distribution** based on goals
4. **Structured meal planning** - breakfast, lunch, dinner, snacks
5. **Weekly diet chart** with timing and portions
6. **AI-powered personalization** for intelligent recommendations

---

## 🤖 Free AI API Options (Research Results)

### 1. **Groq API** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Model** | Llama 3 70B / Llama 3.1 405B |
| **Free Tier** | YES - No credit card required |
| **Rate Limits** | ~30 requests/minute, ~14,400/day |
| **Speed** | Fastest inference in the market |
| **Quality** | Comparable to GPT-4 for structured tasks |
| **Best For** | Diet plan generation, meal suggestions |

**Why Groq is the Best Choice:**
- Completely free with generous limits
- Instant responses (< 1 second)
- High-quality structured JSON output
- Easy API integration
- Active development and support

### 2. **Google Gemini API** (Backup Option)
| Aspect | Details |
|--------|---------|
| **Model** | Gemini 2.5 Flash |
| **Free Tier** | YES - 5-15 RPM |
| **Best For** | Complex reasoning, longer contexts |

### 3. **Other Options**
- **Together AI**: Free credits for new users
- **OpenRouter**: Aggregates models, some free
- **Hugging Face**: Free inference API (slower)

---

## 📐 Scientific Foundation: Calorie Calculation

### Mifflin-St Jeor Equation (Most Accurate)
```javascript
// BMR Calculation
For Men:    BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
For Women:  BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

// TDEE (Total Daily Energy Expenditure)
TDEE = BMR × Activity Multiplier

// Activity Multipliers:
Sedentary (little/no exercise):     1.2
Light (1-3 days/week):              1.375
Moderate (3-5 days/week):           1.55
Active (6-7 days/week):             1.725
Very Active (2x/day):               1.9

// Goal Adjustments:
Weight Loss:     TDEE - 500 calories (0.5 kg/week loss)
Aggressive Loss: TDEE - 750 calories (0.75 kg/week loss)
Muscle Gain:     TDEE + 300-500 calories
Maintenance:     TDEE
```

### Macro Distribution by Goal
```javascript
// Weight Loss (Higher Protein, Moderate Carbs)
Protein: 30-35% | Carbs: 35-40% | Fats: 25-30%

// Muscle Gain (High Protein, High Carbs)
Protein: 25-30% | Carbs: 45-50% | Fats: 20-25%

// Maintenance/Health (Balanced)
Protein: 20-25% | Carbs: 45-50% | Fats: 25-30%

// Keto/Low Carb
Protein: 20-25% | Carbs: 5-10% | Fats: 65-75%
```

---

## 🏗️ Implementation Architecture

### Phase 1: Enhanced User Profile (Week 1)

**New Data Points to Collect:**
```typescript
interface EnhancedUserProfile {
  // Existing
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryRestrictions: string[];
  preferredMealTypes: string[];
  
  // NEW - Physical Metrics
  weight: number;           // in kg
  height: number;           // in cm
  age: number;
  gender: 'male' | 'female' | 'other';
  targetWeight?: number;    // optional goal weight
  
  // NEW - Health & Preferences
  healthConditions: string[];     // diabetes, hypertension, PCOS, etc.
  allergies: string[];            // nuts, shellfish, lactose, etc.
  cuisinePreferences: string[];   // indian, mediterranean, asian, etc.
  mealsPerDay: 3 | 4 | 5 | 6;    // number of meals
  cookingTime: 'minimal' | 'moderate' | 'flexible';
  budget: 'budget' | 'moderate' | 'premium';
  
  // CALCULATED (auto-filled)
  bmr?: number;
  tdee?: number;
  dailyCalorieTarget?: number;
  macroTargets?: {
    protein: number;  // grams
    carbs: number;    // grams
    fats: number;     // grams
  };
}
```

### Phase 2: Backend AI Integration (Week 1-2)

**New Cloudflare Worker Endpoint:**
```
POST /api/nutrition/generate-diet-plan
```

**Request Body:**
```json
{
  "userProfile": { /* EnhancedUserProfile */ },
  "duration": "week",  // or "day"
  "regenerateMeal": null  // or specific meal to regenerate
}
```

**Groq API Integration:**
```javascript
// In _worker.js
async function generateDietPlan(userProfile, env) {
  const prompt = buildDietPlanPrompt(userProfile);
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: DIET_EXPERT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
  });
  
  return response.json();
}
```

**System Prompt (Diet Expert):**
```
You are an expert nutritionist and dietitian with 20+ years of experience creating 
personalized diet plans. You specialize in Indian cuisine and can adapt any diet to 
regional food preferences.

When creating diet plans:
1. Always respect dietary restrictions and allergies
2. Consider cooking time preferences
3. Provide realistic, practical meals
4. Include portion sizes in grams
5. Calculate accurate calories and macros
6. Suggest locally available ingredients
7. Provide meal prep tips
8. Include hydration reminders

Output MUST be valid JSON matching the DietPlan schema.
```

### Phase 3: Diet Chart UI (Week 2-3)

**Diet Chart Components:**
```
components/
├── DietChart/
│   ├── DietChartGenerator.tsx    # Main orchestrator
│   ├── ProfileEnhancement.tsx    # Collect physical data
│   ├── CalorieCalculator.tsx     # Show BMR/TDEE calculation
│   ├── WeeklyPlanView.tsx        # 7-day overview
│   ├── DailyPlanView.tsx         # Single day detail
│   ├── MealCard.tsx              # Individual meal display
│   ├── MacroProgress.tsx         # Daily macro tracking
│   ├── ShoppingList.tsx          # Generated grocery list
│   └── PlanExport.tsx            # PDF/Image export
```

**Diet Plan Schema:**
```typescript
interface DietPlan {
  id: string;
  userId: string;
  generatedAt: string;
  validUntil: string;
  
  // Targets
  dailyCalories: number;
  macroTargets: { protein: number; carbs: number; fats: number };
  
  // Weekly Plan
  days: DayPlan[];
  
  // Extras
  shoppingList: ShoppingItem[];
  mealPrepTips: string[];
  hydrationGoal: number; // ml
}

interface DayPlan {
  day: 'Monday' | 'Tuesday' | ... ;
  date?: string;
  meals: Meal[];
  totalCalories: number;
  totalMacros: { protein: number; carbs: number; fats: number };
}

interface Meal {
  id: string;
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack' | 'dinner';
  time: string;  // "8:00 AM"
  name: string;
  description: string;
  ingredients: Ingredient[];
  calories: number;
  macros: { protein: number; carbs: number; fats: number };
  prepTime: number;  // minutes
  cookingInstructions?: string;
  alternatives: string[];  // Quick swap options
  imageKeyword: string;  // For fetching image
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'protein' | 'grains' | 'spices' | 'other';
}
```

---

## 🎨 User Experience Flow

### Step 1: Enhanced Profile Setup
```
┌─────────────────────────────────────────────────┐
│  🎯 Let's Create Your Perfect Diet Plan         │
│                                                 │
│  Step 1/5: Your Body Metrics                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                 │
│  Weight: [____] kg    Height: [____] cm         │
│  Age: [____]          Gender: [M] [F] [Other]   │
│  Target Weight: [____] kg (optional)            │
│                                                 │
│              [Continue →]                       │
└─────────────────────────────────────────────────┘
```

### Step 2: AI Calculation Display
```
┌─────────────────────────────────────────────────┐
│  📊 Your Personalized Nutrition Blueprint       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ BMR (Resting Calories): 1,650 kcal      │   │
│  │ TDEE (Daily Burn): 2,145 kcal           │   │
│  │ Target for Weight Loss: 1,645 kcal      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Your Daily Macro Targets:                      │
│  🥩 Protein: 123g (30%)                         │
│  🍚 Carbs: 165g (40%)                           │
│  🥑 Fats: 55g (30%)                             │
│                                                 │
│      [🤖 Generate My AI Diet Plan]              │
└─────────────────────────────────────────────────┘
```

### Step 3: Generated Diet Chart
```
┌─────────────────────────────────────────────────┐
│  🍽️ Your Personalized Weekly Diet Plan          │
│                                                 │
│  [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]     │
│   ↓                                             │
│  ┌─────────────────────────────────────────┐   │
│  │ 🌅 Breakfast (8:00 AM) - 380 kcal       │   │
│  │ ─────────────────────────────────────── │   │
│  │ Masala Omelette with Whole Wheat Toast  │   │
│  │                                         │   │
│  │ 🥚 Eggs (2) - 140 kcal                  │   │
│  │ 🍞 Whole wheat bread (2 slices) - 160   │   │
│  │ 🧈 Butter (1 tsp) - 35 kcal             │   │
│  │ 🫑 Onion, tomato (chopped) - 25 kcal    │   │
│  │ 🌶️ Green chilli - 5 kcal                │   │
│  │                                         │   │
│  │ P: 18g | C: 32g | F: 18g                │   │
│  │                                         │   │
│  │ [🔄 Swap] [📋 Recipe] [✅ Complete]     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [🛒 Shopping List] [📥 Export PDF]            │
└─────────────────────────────────────────────────┘
```

---

## 🔐 API Key Management

```javascript
// wrangler.backend.toml
[vars]
# Add new secret
# Run: wrangler secret put GROQ_API_KEY --config wrangler.backend.toml

// In _worker.js
const GROQ_API_KEY = env.GROQ_API_KEY;
```

**To get Groq API Key (FREE):**
1. Go to https://console.groq.com/
2. Sign up (no credit card needed)
3. Create API key
4. Add to Cloudflare Worker secrets

---

## 📊 Feature Comparison: Before vs After

| Aspect | Current "For You" | New AI Diet Chart |
|--------|-------------------|-------------------|
| Profile Data | 4 basic fields | 15+ comprehensive fields |
| Calorie Calc | None | Scientific BMR/TDEE |
| Recommendations | Rule-based, generic | AI-powered, personalized |
| Diet Plan | No | Full weekly meal plan |
| Macro Tracking | No | Yes, with progress bars |
| Meal Details | Basic | Complete with ingredients, portions |
| Shopping List | No | Auto-generated |
| Export | No | PDF, Image |
| AI Model | None | Llama 3 70B via Groq |
| Cost | Free | Free (Groq free tier) |

---

## 📅 Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Profile Enhancement | New profile fields, calorie calculator, UI updates |
| 1-2 | Backend AI | Groq integration, diet plan endpoint, caching |
| 2-3 | Diet Chart UI | Weekly view, daily view, meal cards, interactions |
| 3 | Polish & Extras | Shopping list, export, regeneration, error handling |

---

## 🎯 Success Metrics

1. **User Engagement**: Time spent on "For You" tab
2. **Plan Generation**: Number of diet plans generated
3. **Completion Rate**: Users who finish profile setup
4. **Return Rate**: Users who come back to check their plan
5. **User Satisfaction**: Feedback on plan quality

---

## 🚀 Getting Started

### Prerequisites:
1. Groq API Key (free at console.groq.com)
2. Updated user profile schema
3. New backend endpoint

### First Steps:
1. Sign up for Groq API (5 minutes)
2. Add API key to Cloudflare Worker secrets
3. Implement enhanced profile collection
4. Build calorie calculator
5. Create Groq integration endpoint
6. Build diet chart UI components

---

## 📝 Notes

- **Privacy**: User data stored locally in localStorage, only sent to AI when generating
- **Caching**: Cache generated plans for 24 hours to reduce API calls
- **Fallback**: If AI fails, show rule-based recommendations
- **Customization**: Users can regenerate individual meals
- **Indian Focus**: System prompt emphasizes Indian cuisine options

This feature will transform the Nutrition section into a **truly valuable, AI-powered health tool** that users will return to daily.
