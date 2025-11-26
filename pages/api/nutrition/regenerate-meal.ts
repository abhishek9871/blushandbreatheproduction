import type { NextApiRequest, NextApiResponse } from 'next';

// Configure for longer timeout
export const config = {
  maxDuration: 30, // 30 seconds is enough for single meal
};

interface UserProfile {
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
  dietaryRestrictions?: string[];
  allergies?: string[];
  cuisinePreferences?: string[];
}

interface RequestBody {
  userProfile: UserProfile;
  dayIndex: number;
  mealType: string;
  currentMeal?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, dayIndex, mealType, currentMeal }: RequestBody = req.body;

    if (!userProfile || dayIndex === undefined || !mealType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const {
      dailyCalorieTarget,
      macroTargets,
      dietaryRestrictions = [],
      allergies = [],
      cuisinePreferences = [],
    } = userProfile;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Use current meal's calories as target, or calculate based on meal type
    let targetCalories: number;
    let targetMacros = { protein: 0, carbs: 0, fats: 0 };
    
    if (currentMeal?.totalCalories) {
      // Use the exact same calories as the current meal for a true swap
      targetCalories = currentMeal.totalCalories;
      if (currentMeal.macros) {
        targetMacros = currentMeal.macros;
      }
    } else {
      // Fallback to percentage-based calculation
      switch (mealType) {
        case 'breakfast':
          targetCalories = Math.round(dailyCalorieTarget * 0.25);
          break;
        case 'lunch':
          targetCalories = Math.round(dailyCalorieTarget * 0.35);
          break;
        case 'dinner':
          targetCalories = Math.round(dailyCalorieTarget * 0.3);
          break;
        default:
          targetCalories = Math.round(dailyCalorieTarget * 0.1);
      }
    }

    // Build a smarter prompt that considers alternatives and keeps nutrition similar
    const hasAlternatives = currentMeal?.alternatives && currentMeal.alternatives.length > 0;
    const alternativeSuggestion = hasAlternatives 
      ? `Consider using one of these suggested alternatives as inspiration: ${currentMeal.alternatives.join(', ')}.`
      : '';

    const prompt = `Generate a COMPLETELY DIFFERENT ${mealType} meal to swap with the current one.

IMPORTANT REQUIREMENTS:
- Target calories: approximately ${targetCalories} kcal (±10%)
${targetMacros.protein > 0 ? `- Target macros: ~${targetMacros.protein}g protein, ~${targetMacros.carbs}g carbs, ~${targetMacros.fats}g fats` : ''}
${dietaryRestrictions.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${allergies.length > 0 ? `- Allergies to avoid: ${allergies.join(', ')}` : ''}
${cuisinePreferences.length > 0 ? `- Cuisine preferences: ${cuisinePreferences.join(', ')}` : '- Use Indian or international cuisine'}

${currentMeal ? `CURRENT MEAL TO REPLACE (generate something DIFFERENT):
- Name: ${currentMeal.name}
- Description: ${currentMeal.description || 'N/A'}
- Main ingredients: ${currentMeal.ingredients?.map((i: any) => i.name).slice(0, 5).join(', ') || 'N/A'}

${alternativeSuggestion}

DO NOT use the same main ingredients. Create a fresh, different meal option that the user would enjoy as a change.` : ''}

Return ONLY valid JSON in this exact format:
{
  "type": "${mealType}",
  "time": "${currentMeal?.time || 'appropriate time'}",
  "name": "New Meal Name (different from current)",
  "description": "Brief appetizing description",
  "ingredients": [{ "name": "Item", "quantity": 100, "unit": "g", "calories": 150 }],
  "totalCalories": ${targetCalories},
  "macros": { "protein": ${targetMacros.protein || 'X'}, "carbs": ${targetMacros.carbs || 'Y'}, "fats": ${targetMacros.fats || 'Z'} },
  "prepTime": 15,
  "instructions": "Clear step-by-step instructions",
  "alternatives": ["Option 1", "Option 2"]
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `You are a nutritionist. Return ONLY valid JSON.\n\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      return res.status(500).json({ error: 'Failed to regenerate meal' });
    }

    const geminiData = await geminiResponse.json();
    let mealContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Clean up markdown code blocks if present
    mealContent = mealContent.trim();
    if (mealContent.startsWith('```json')) mealContent = mealContent.slice(7);
    else if (mealContent.startsWith('```')) mealContent = mealContent.slice(3);
    if (mealContent.endsWith('```')) mealContent = mealContent.slice(0, -3);
    mealContent = mealContent.trim();

    const newMeal = JSON.parse(mealContent);

    return res.status(200).json({ meal: newMeal, dayIndex, mealType });
  } catch (error: any) {
    console.error('Meal regeneration error:', error);
    return res.status(500).json({ error: 'Failed to regenerate meal' });
  }
}
