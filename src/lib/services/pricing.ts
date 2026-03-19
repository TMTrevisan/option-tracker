export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export async function getLiveQuote(symbol: string): Promise<LiveQuote | null> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
  
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) return null;

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Advanced Level 2: Fetch Greeks for active derivative marking
 * Note: Requires premium OPRA feed (e.g. Polygon.io / Tradier)
 */
export async function getOptionsGreeks(symbol: string, expiration: string, strike: number, type: 'CALL'|'PUT') {
  // Mock OPRA architecture for future data injection
  return {
    delta: 0.50,
    gamma: 0.05,
    theta: -0.12,
    vega: 0.20,
    impliedVolatility: 0.25,
    underlyingPrice: await getLiveQuote(symbol).then(q => q?.price || 0)
  };
}
