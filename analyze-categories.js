import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('articles.json', 'utf8'));
const categories = {};

data.articles.forEach(article => {
  const cat = article.category || 'Unknown';
  categories[cat] = (categories[cat] || 0) + 1;
});

console.log('\n=== Category Distribution (First 50 Articles) ===');
console.log('Total Articles:', data.articles.length);
console.log('Total in DB:', data.totalResults);
console.log('\nBreakdown:');

Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const pct = ((count / data.articles.length) * 100).toFixed(1);
    console.log(`  ${cat}: ${count} (${pct}%)`);
  });

console.log('\n=== Sample Article Titles by Category ===');
const sampleSize = 2;
Object.keys(categories).forEach(cat => {
  console.log(`\n${cat}:`);
  data.articles
    .filter(a => a.category === cat)
    .slice(0, sampleSize)
    .forEach(a => console.log(`  - ${a.title.substring(0, 80)}...`));
});
