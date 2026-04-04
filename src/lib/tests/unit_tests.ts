/**
 * RollTrackr Regression Tests
 * Run with: npx ts-node src/lib/tests/unit_tests.ts
 */

import { calculateGreeks } from '../utils/greeks';
import { autoClassifyStrategy, isLikelyRoll } from '../utils/classification';

function testGreeks() {
  console.log('--- Testing Greeks Logic ---');
  const g = calculateGreeks(200, 200, 0.1, 0.3, 0.05, 'CALL');
  console.log('ATM Call Delta:', g.delta.toFixed(3));
  if (Math.abs(g.delta - 0.5) < 0.1) {
    console.log('✅ Greeks Delta check passed');
  } else {
    console.error('❌ Greeks Delta check failed');
  }
}

function testStrategyClassification() {
  console.log('\n--- Testing Strategy Classification ---');
  
  const cases = [
    { params: { tradeType: 'STO', optionType: 'PUT', symbol: 'TSLA' }, expected: 'Short Put' },
    { params: { tradeType: 'BTO', optionType: 'CALL', symbol: 'NVDA' }, expected: 'Long Call' },
    { params: { tradeType: 'BUY', assetType: 'EQUITY', symbol: 'AAPL' } as any, expected: 'Long Stock' },
    { params: { tradeType: 'SELL', symbol: 'MSFT' } as any, expected: 'Short Stock' },
  ];

  cases.forEach(c => {
    const res = autoClassifyStrategy(c.params);
    if (res === c.expected) {
      console.log(`✅ ${c.params.tradeType} ${c.params.symbol} classified as ${res}`);
    } else {
      console.error(`❌ ${c.params.tradeType} ${c.params.symbol} FAILED. Expected ${c.expected}, got ${res}`);
    }
  });
}

function testRollDetection() {
  console.log('\n--- Testing Roll Detection ---');
  const d1 = '2026-03-10T15:00:00Z';
  const d2 = '2026-03-12T10:00:00Z'; // < 48 hours
  const d3 = '2026-03-20T10:00:00Z'; // > 96 hours

  if (isLikelyRoll(d1, d2)) console.log('✅ Roll detected correctly (<96h)');
  if (!isLikelyRoll(d1, d3)) console.log('✅ Distance detected correctly (>96h)');
}

async function runTests() {
  try {
    testGreeks();
    testStrategyClassification();
    testRollDetection();
    console.log('\n--- All Tests Completed ---');
  } catch (e) {
    console.error('Tests failed with error:', e);
    process.exit(1);
  }
}

runTests();
