import type { NextApiRequest, NextApiResponse } from 'next';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchItem {
  id: { videoId: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
  };
}

// Parse ISO 8601 duration to seconds
function parseDuration(isoDuration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = isoDuration.match(regex);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

// Format duration for display
function formatDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = isoDuration.match(regex);
  if (!match) return '0:00';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Build search queries based on category
function buildSearchQuery(category: string, type: 'shorts' | 'long' | 'all', customQuery?: string): string {
  const baseQueries: Record<string, string> = {
    'All': 'health beauty skincare wellness nutrition tips',
    'Skincare': 'skincare routine glowing skin tips facial care dermatologist',
    'Makeup': 'makeup tutorial beauty tips makeup looks professional makeup',
    'Wellness': 'wellness health tips fitness yoga meditation mental health',
    'Nutrition': 'nutrition healthy diet meal prep healthy eating weight loss',
    'Haircare': 'hair care tips healthy hair routine hair growth treatment',
    'Fitness': 'fitness workout exercise routine home workout gym tips',
  };

  let query = customQuery || baseQueries[category] || baseQueries['All'];
  
  // Add type-specific modifiers
  if (type === 'shorts') {
    query += ' #shorts short video quick tips';
  } else if (type === 'long') {
    query += ' full tutorial guide comprehensive';
  }

  return query;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    const {
      category = 'All',
      type = 'all', // 'shorts', 'long', 'all'
      query: customQuery,
      pageToken,
      maxResults = '12',
    } = req.query;

    const searchQuery = buildSearchQuery(
      category as string, 
      type as 'shorts' | 'long' | 'all',
      customQuery as string | undefined
    );

    // Search for videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      q: searchQuery,
      maxResults: String(Math.min(parseInt(maxResults as string), 50)),
      key: YOUTUBE_API_KEY,
      order: 'relevance',
      relevanceLanguage: 'en',
      safeSearch: 'moderate',
      videoEmbeddable: 'true',
    });

    // For shorts, try to filter by short duration
    if (type === 'shorts') {
      searchParams.set('videoDuration', 'short'); // < 4 minutes
    } else if (type === 'long') {
      searchParams.set('videoDuration', 'medium'); // 4-20 minutes
    }

    if (pageToken) {
      searchParams.set('pageToken', pageToken as string);
    }

    const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams.toString()}`);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube Search API error:', errorData);
      return res.status(searchResponse.status).json({ 
        error: 'YouTube API error',
        details: errorData 
      });
    }

    const searchData = await searchResponse.json();
    const videoIds = (searchData.items || []).map((item: YouTubeSearchItem) => item.id.videoId);

    if (videoIds.length === 0) {
      return res.status(200).json({
        videos: [],
        nextPageToken: null,
        hasMore: false,
      });
    }

    // Get video details with statistics
    const videosParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
    });

    const videosResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${videosParams.toString()}`);
    
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error('YouTube Videos API error:', errorData);
      return res.status(videosResponse.status).json({ 
        error: 'YouTube API error',
        details: errorData 
      });
    }

    const videosData = await videosResponse.json();

    // Process videos
    let videos = (videosData.items || []).map((item: YouTubeVideoItem) => {
      const durationSeconds = parseDuration(item.contentDetails.duration);
      const isShort = durationSeconds <= 60;

      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        imageUrl:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        durationSeconds,
        viewCount: parseInt(item.statistics.viewCount) || 0,
        isShort,
      };
    });

    // Filter by type if needed
    if (type === 'shorts') {
      videos = videos.filter((v: any) => v.durationSeconds <= 60);
    } else if (type === 'long') {
      videos = videos.filter((v: any) => v.durationSeconds > 60);
    }

    // Sort by view count (most popular first)
    videos.sort((a: any, b: any) => b.viewCount - a.viewCount);

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json({
      videos,
      nextPageToken: searchData.nextPageToken || null,
      hasMore: !!searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || videos.length,
    });
  } catch (error) {
    console.error('YouTube API handler error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch videos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
