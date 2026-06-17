const { generateDataset } = require('./data_generator.js');

const data = generateDataset();
console.log('--- DATASET VERIFICATION ---');
console.log('Total Customers:', data.length);

const highRiskCount = data.filter(c => c.highRiskFlag).length;
console.log('High Risk Rate:', (highRiskCount / data.length * 100).toFixed(1) + '%', `(${highRiskCount} customers)`);

const fraudCount = data.filter(c => c.fraudFlag).length;
console.log('Fraud Rate:', (fraudCount / data.length * 100).toFixed(1) + '%', `(${fraudCount} customers)`);

const avgCreditScore = data.reduce((sum, c) => sum + c.creditScore, 0) / data.length;
console.log('Avg Credit Score:', avgCreditScore.toFixed(1));

const avgDti = data.reduce((sum, c) => sum + c.dti, 0) / data.length;
console.log('Avg DTI:', avgDti.toFixed(1) + '%');

const fraudOutsideHighRisk = data.filter(c => c.fraudFlag && !c.highRiskFlag).length;
console.log('Fraud cases outside High Risk (should be 0):', fraudOutsideHighRisk);

// Employment Status Mix
const empCounts = {};
data.forEach(c => {
  empCounts[c.employmentStatus] = (empCounts[c.employmentStatus] || 0) + 1;
});
console.log('\nEmployment Status Mix:');
for (const key in empCounts) {
  console.log(`- ${key}: ${(empCounts[key] / data.length * 100).toFixed(1)}% (${empCounts[key]})`);
}

// Risk by Late Payments
console.log('\nRisk by Late Payment Count:');
for (let i = 0; i <= 6; i++) {
  const filtered = data.filter(c => c.latePayments === i);
  const hr = filtered.filter(c => c.highRiskFlag).length;
  console.log(`- ${i} late payments: Risk Rate = ${(hr / filtered.length * 100).toFixed(1)}% (${hr}/${filtered.length})`);
}

// Risk by Credit Score Band
const bands = {
  'Poor (<580)': c => c.creditScore < 580,
  'Fair (580-669)': c => c.creditScore >= 580 && c.creditScore < 670,
  'Good (670-739)': c => c.creditScore >= 670 && c.creditScore < 740,
  'Very Good (740-799)': c => c.creditScore >= 740 && c.creditScore < 800,
  'Exceptional (800+)': c => c.creditScore >= 800
};
console.log('\nRisk by Credit Score Band:');
for (const band in bands) {
  const filtered = data.filter(bands[band]);
  const hr = filtered.filter(c => c.highRiskFlag).length;
  console.log(`- ${band}: Risk Rate = ${(hr / filtered.length * 100).toFixed(1)}% (${hr}/${filtered.length})`);
}
