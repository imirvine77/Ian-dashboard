const GOOGLE_API_KEY = 'AIzaSyANA63pA-Mv8dGUvzHCzRUu_n7WoYue1OM';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { type, city } = JSON.parse(event.body || '{}');
    if (!city || !type) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing city or type' }) };
    }

    // Step 1: Text search to find places
    const query = type === 'restaurants'
      ? `best restaurants in ${city}`
      : `top attractions things to do in ${city}`;

    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.editorialSummary,places.types,places.priceLevel',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 10,
        languageCode: 'en',
      }),
    });

    const searchData = await searchRes.json();

    if (!searchData.places || searchData.places.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
    }

    const results = searchData.places.map(place => ({
      name: place.displayName?.text || 'Unknown',
      rating: place.rating || null,
      ratingCount: place.userRatingCount || 0,
      summary: place.editorialSummary?.text || null,
      priceLevel: place.priceLevel || null,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
