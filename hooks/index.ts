export { ThemeProvider, useTheme } from './useTheme';
export { BookmarkProvider, useBookmarks, type BookmarkableItem } from './useBookmarks';
export { NutritionCartProvider, useNutritionCart, type CartItem } from './useNutritionCart';
export { UserProfileProvider, useUserProfile, type UserProfile, type Recommendation } from './useUserProfile';

// Substance Education Hooks
export {
  useMedicine,
  useBannedSubstance,
  useSupplement,
  useAffiliateProducts,
  useDrugInteractions,
  useSubstanceSearch,
  useLegalAlternatives,
  useAffiliateClickTracking,
} from './useSubstanceData';
