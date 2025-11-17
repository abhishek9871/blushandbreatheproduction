// Simple test script to verify YouTube API is working
// Run with: node test-youtube-api.js

const API_KEY = 'AIzaSyAhO7HnkzSlfCcNq92ztaRFn492RA6YdSA';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function testYouTubeAPI() {
    console.log('🧪 Testing YouTube API Integration...\n');

    try {
        // Step 1: Search for videos
        console.log('📍 Step 1: Searching YouTube for videos...');
        const searchParams = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            q: 'health beauty skincare wellness nutrition tutorial',
            maxResults: '4',
            key: API_KEY,
            order: 'relevance',
            videoCaption: 'any',
        });

        const searchUrl = `${YOUTUBE_API_BASE_URL}/search?${searchParams.toString()}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            throw new Error(`Search API error: ${searchResponse.status} ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();
        console.log(`✅ Search successful! Found ${searchData.items?.length || 0} videos\n`);

        const videoIds = (searchData.items || []).map(item => item.id.videoId);

        if (videoIds.length === 0) {
            console.log('❌ No videos found');
            return;
        }

        console.log(`📍 Step 2: Getting video details for IDs: ${videoIds.join(', ')}`);

        // Step 2: Get video details including duration
        const videosParams = new URLSearchParams({
            part: 'snippet,contentDetails',
            id: videoIds.join(','),
            key: API_KEY,
        });

        const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?${videosParams.toString()}`;
        const videosResponse = await fetch(videosUrl);

        if (!videosResponse.ok) {
            throw new Error(`Videos API error: ${videosResponse.status} ${videosResponse.statusText}`);
        }

        const videosData = await videosResponse.json();
        console.log(`✅ Got details for ${videosData.items?.length || 0} videos\n`);

        // Format duration function
        const formatDuration = (isoDuration) => {
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
        };

        // Display results
        console.log('📺 Videos Retrieved:\n');
        (videosData.items || []).forEach((item, index) => {
            const duration = formatDuration(item.contentDetails.duration);
            const thumbnail = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || 'N/A';
            
            console.log(`${index + 1}. ${item.snippet.title}`);
            console.log(`   ID: ${item.id}`);
            console.log(`   Duration: ${duration}`);
            console.log(`   Thumbnail: ${thumbnail}`);
            console.log(`   Description: ${item.snippet.description.substring(0, 100)}...\n`);
        });

        console.log('✅ YouTube API Integration Test PASSED!\n');
        console.log('All systems ready for videos page deployment.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testYouTubeAPI();
