import type { NextApiRequest, NextApiResponse } from 'next';

// Configure for longer timeout (Vercel free tier allows up to 60s)
export const config = {
  maxDuration: 60, // 60 seconds timeout
};

interface UserProfile {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  primaryGoal: string;
  dietaryRestrictions: string[];
  allergies: string[];
  cuisinePreferences: string[];
  mealsPerDay: number;
  cookingTime: string;
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface RequestBody {
  userProfile: UserProfile;
  duration: 'day' | 'week';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, duration = 'week' }: RequestBody = req.body;

    if (!userProfile) {
      return res.status(400).json({ error: 'Missing user profile' });
    }

    const {
      weight,
      height,
      age,
      gender,
      activityLevel,
      primaryGoal,
      dietaryRestrictions = [],
      allergies = [],
      cuisinePreferences = [],
      mealsPerDay = 4,
      cookingTime = 'moderate',
      dailyCalorieTarget,
      macroTargets,
    } = userProfile;

    if (!dailyCalorieTarget || !macroTargets) {
      return res.status(400).json({ error: 'Missing calorie target or macros' });
    }

    // Get Gemini API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Build the prompt - simplified for faster, more reliable responses
    const systemPrompt = `You are a nutritionist. Create a ${duration === 'day' ? '1-day' : '7-day'} meal plan. Return ONLY valid JSON.

JSON Schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "time": "8:00 AM",
          "name": "Meal name",
          "description": "Brief description",
          "ingredients": [{"name": "Item", "quantity": 100, "unit": "g", "calories": 150}],
          "totalCalories": 400,
          "macros": {"protein": 20, "carbs": 45, "fats": 12},
          "prepTime": 15,
          "instructions": "Brief instructions",
          "alternatives": ["Option 1"]
        }
      ],
      "dailyTotals": {"calories": 2000, "protein": 150, "carbs": 180, "fats": 70}
    }
  ],
  "shoppingList": [{"name": "Item", "quantity": "500g", "category": "produce"}],
  "mealPrepTips": ["Tip 1"],
  "weeklyNotes": "Brief notes"
}`;

    const userPrompt = `Create a personalized ${duration === 'day' ? 'daily' : 'weekly'} meal plan with these specifications:

USER PROFILE:
- Age: ${age} years, Gender: ${gender}
- Weight: ${weight} kg, Height: ${height} cm
- Activity Level: ${activityLevel}
- Primary Goal: ${primaryGoal}

NUTRITION TARGETS:
- Daily Calories: ${dailyCalorieTarget} kcal
- Protein: ${macroTargets.protein}g (${Math.round(macroTargets.protein * 4 / dailyCalorieTarget * 100)}%)
- Carbs: ${macroTargets.carbs}g (${Math.round(macroTargets.carbs * 4 / dailyCalorieTarget * 100)}%)
- Fats: ${macroTargets.fats}g (${Math.round(macroTargets.fats * 9 / dailyCalorieTarget * 100)}%)

DIETARY RESTRICTIONS: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}
CUISINE: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Indian'}
MEALS: ${mealsPerDay} per day

Generate the meal plan. Keep descriptions brief. Use simple ingredient lists (max 4 items per meal).`;

    // Call Google Gemini API
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
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        return res.status(429).json({
          error: 'AI service is busy. Please try again in a moment.',
          retryAfter: 30,
        });
      }

      return res.status(500).json({
        error: 'Failed to generate diet plan',
        details: errorText,
      });
    }

    const geminiData = await geminiResponse.json();
    
    // Check for finish reason
    const finishReason = geminiData.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      console.error('Gemini finish reason:', finishReason);
      return res.status(500).json({ 
        error: `AI generation incomplete: ${finishReason}`,
        details: 'The model may have hit a limit. Try again.'
      });
    }
    
    // Concatenate all parts (in case of multi-part response)
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const aiContent = parts.map((p: any) => p.text || '').join('');

    if (!aiContent) {
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    // Parse AI response - clean up any markdown code blocks
    let dietPlan;
    try {
      let cleanedContent = aiContent.trim();
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      dietPlan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return res.status(500).json({
        error: 'AI response was not valid JSON',
        raw: aiContent.substring(0, 500),
      });
    }

    // Enhance the response with metadata
    const enhancedPlan = {
      ...dietPlan,
      id: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userTargets: {
        dailyCalories: dailyCalorieTarget,
        macros: macroTargets,
      },
      duration,
      aiModel: 'gemini-2.0-flash',
    };

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(enhancedPlan);
  } catch (error: any) {
    console.error('Diet plan generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate diet plan',
      message: error.message,
    });
  }
}
