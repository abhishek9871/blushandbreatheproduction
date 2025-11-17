# Quick Deploy - YouTube Videos Feature

## ⚡ TL;DR (5 Minutes)

### 1. Set Your API Key (Choose One)

**Option A: Local Testing**
```bash
echo "VITE_YOUTUBE_API_KEY=YOUR_KEY_HERE" >> .env.local
```

**Option B: Cloudflare Pages Dashboard**
- Go to: https://dash.cloudflare.com/
- Pages → jyotilalchandani → Settings
- Environment Variables
- Add: `VITE_YOUTUBE_API_KEY` = `YOUR_KEY`

### 2. Test Locally
```bash
npm run dev
# Visit http://localhost:3001/videos
# Click a video to play it ✅
```

### 3. Deploy to Production
```bash
npm run build
npx wrangler pages deploy dist --commit-dirty
# Wait ~30 seconds
# Visit https://jyotilalchandani.pages.dev/videos ✅
```

---

## 🎬 What Was Added

### Videos Now:
✅ Load from YouTube API (real videos)  
✅ Display actual thumbnails  
✅ Show correct video duration  
✅ Play when clicked (fullscreen modal)  
✅ Have a fallback to mock data (no breaking)  

### No Regressions:
✅ Infinite scroll still works  
✅ Bookmarks still work  
✅ All other pages unchanged  
✅ Mock data fallback active  

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `services/apiService.ts` | Enhanced YouTube API (line 159-268) |
| `components/VideoCard.tsx` | Added play button & modal |
| `components/VideoPlayer.tsx` | **NEW** - Video player modal |

---

## ✅ Quick Checklist

- [ ] Have YouTube API key ready
- [ ] Set environment variable (local or Cloudflare)
- [ ] Run `npm run dev` and test locally
- [ ] Run `npm run build` (should succeed)
- [ ] Deploy with `npx wrangler pages deploy dist --commit-dirty`
- [ ] Test on production URL
- [ ] Videos load and play ✅

---

## 🆘 If Something's Wrong

| Problem | Fix |
|---------|-----|
| "Missing API key" error | Add `VITE_YOUTUBE_API_KEY` to `.env.local` |
| Mock data showing | API key might be invalid or quota exceeded |
| Videos won't play | Check browser console (F12) for errors |
| 403 error | YouTube API quota exceeded (get new key) |

---

## 📚 Full Documentation

See `YOUTUBE_VIDEO_IMPLEMENTATION.md` for complete details.

---

**Ready to deploy!** 🚀
