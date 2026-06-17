// Data Generator for McKinsey Credit Risk Portfolio Dashboard
// Generates 5,000 customer accounts with realistic credit risk attributes matching the PDF statistics.

// Seeded random number generator (Mulberry32) for repeatability
function createRandom(seed) {
  let h = seed;
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDataset() {
  const rand = createRandom(42); // Seeded for consistency
  const N = 5000;
  const customers = [];

  // Target distributions:
  // 1. Employment Status: Employed 35%, Self-Employed 33%, Unemployed 32%
  // 2. High-Risk Share: 76.6% (3,830 customers)
  // 3. Fraud Incidence: 2.9% (145 customers) - 100% concentrated in high-risk segment
  // 4. Avg Credit Score: 599
  // 5. Avg DTI: 29.7%

  // Build exact counts where possible, then distribute variables
  const empStatuses = [];
  for (let i = 0; i < 1750; i++) empStatuses.push('Employed');
  for (let i = 0; i < 1650; i++) empStatuses.push('Self-Employed');
  for (let i = 0; i < 1600; i++) empStatuses.push('Unemployed');

  // Shuffle employment status deterministically
  for (let i = empStatuses.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = empStatuses[i];
    empStatuses[i] = empStatuses[j];
    empStatuses[j] = temp;
  }

  // Pre-generate risk flags to guarantee exactly 76.6% high risk (3830 customers)
  const isHighRisk = new Array(N).fill(false);
  // We want to link high-risk to Poor Credit score and 4+ Late Payments
  // Let's generate attributes first, then assign risk, and then correct it to hit exactly 3830

  for (let i = 0; i < N; i++) {
    // 1. Late payments: 0 to 6
    // We want ~50% to have 4+ late payments to match the charts
    let latePayments = 0;
    const rLate = rand();
    if (rLate < 0.12) latePayments = 0;
    else if (rLate < 0.24) latePayments = 1;
    else if (rLate < 0.36) latePayments = 2;
    else if (rLate < 0.49) latePayments = 3;
    else if (rLate < 0.68) latePayments = 4;
    else if (rLate < 0.85) latePayments = 5;
    else latePayments = 6;

    // 2. Credit Score: 300 to 850
    // Poor (<580) should be ~48% of the population
    let creditScore = 0;
    const rScore = rand();
    if (rScore < 0.48) {
      // Poor (<580): Mean 480, SD 50
      creditScore = Math.floor(350 + rand() * 229); // 350 to 579
    } else {
      // Bands 580+ (Fair 580-669, Good 670-739, Very Good 740-799, Exceptional 800+)
      // Uniformly spread to hit appropriate bands, average score around 710 for these bands
      const rBand = rand();
      if (rBand < 0.4) {
        creditScore = Math.floor(580 + rand() * 90); // Fair (580-669)
      } else if (rBand < 0.7) {
        creditScore = Math.floor(670 + rand() * 70); // Good (670-739)
      } else if (rBand < 0.9) {
        creditScore = Math.floor(740 + rand() * 60); // Very Good (740-799)
      } else {
        creditScore = Math.floor(800 + rand() * 51); // Exceptional (800+)
      }
    }

    // 3. Age: 18 to 80
    // Distributed according to bands: 18-25, 26-35, 36-45, 46-55, 56-65, 66+
    let age = 18;
    const rAge = rand();
    if (rAge < 0.18) age = Math.floor(18 + rand() * 8); // 18-25
    else if (rAge < 0.40) age = Math.floor(26 + rand() * 10); // 26-35
    else if (rAge < 0.60) age = Math.floor(36 + rand() * 10); // 36-45
    else if (rAge < 0.78) age = Math.floor(46 + rand() * 10); // 46-55
    else if (rAge < 0.93) age = Math.floor(56 + rand() * 10); // 56-65
    else age = Math.floor(66 + rand() * 15); // 66+

    // 4. Debt-To-Income (DTI) %: centered around 29.7%
    // Standard deviation ~8%, clamped between 5% and 65%
    let dti = Math.round(29.7 + (rand() - 0.5) * 30 + (rand() - 0.5) * 15);
    dti = Math.max(5, Math.min(65, dti));

    customers.push({
      id: `C${String(i + 1).padStart(4, '0')}`,
      age,
      employmentStatus: empStatuses[i],
      creditScore,
      dti,
      latePayments,
      highRiskFlag: false,
      fraudFlag: false
    });
  }

  // 5. Determine High-Risk Flags based on rules to align with PDF and hits exactly 3,830.
  // Rule 1: Credit Score < 580 (Poor) -> High Risk
  // Rule 2: Late Payments >= 4 -> High Risk
  // Rule 3: Otherwise, ~54% probability of High Risk
  
  let highRiskCount = 0;
  const potentialHighRiskIndices = [];
  const forcedHighRiskIndices = new Set();

  customers.forEach((c, idx) => {
    if (c.creditScore < 580 || c.latePayments >= 4) {
      forcedHighRiskIndices.add(idx);
      c.highRiskFlag = true;
      highRiskCount++;
    } else {
      potentialHighRiskIndices.push(idx);
    }
  });

  // If forced counts are not exactly 3830, we adjust from the potential pool.
  const targetHighRisk = 3830;
  if (highRiskCount < targetHighRisk) {
    // Shuffle potential indices
    for (let i = potentialHighRiskIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const temp = potentialHighRiskIndices[i];
      potentialHighRiskIndices[i] = potentialHighRiskIndices[j];
      potentialHighRiskIndices[j] = temp;
    }
    // Add more high risk
    const diff = targetHighRisk - highRiskCount;
    for (let i = 0; i < diff; i++) {
      const idx = potentialHighRiskIndices[i];
      customers[idx].highRiskFlag = true;
    }
  } else if (highRiskCount > targetHighRisk) {
    // If we have too many forced (which shouldn't happen unless distributions are off),
    // convert some forced ones to low risk (starting from latePayments < 4 & creditScore >= 580 if any)
    const forcedArr = Array.from(forcedHighRiskIndices);
    // Sort so we prioritize removing risk flags from those with better credit score / fewer late payments
    forcedArr.sort((a, b) => {
      const scoreA = customers[a].creditScore;
      const scoreB = customers[b].creditScore;
      return scoreB - scoreA; // higher score first
    });
    const diff = highRiskCount - targetHighRisk;
    for (let i = 0; i < diff; i++) {
      customers[forcedArr[i]].highRiskFlag = false;
    }
  }

  // 6. Assign Fraud Flags: exactly 145 customers (2.9%), concentrated entirely in High-Risk segment.
  const highRiskIndices = [];
  customers.forEach((c, idx) => {
    if (c.highRiskFlag) {
      highRiskIndices.push(idx);
    }
  });

  // Shuffle high risk indices
  for (let i = highRiskIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = highRiskIndices[i];
    highRiskIndices[i] = highRiskIndices[j];
    highRiskIndices[j] = temp;
  }

  const targetFraud = 145;
  for (let i = 0; i < targetFraud; i++) {
    const idx = highRiskIndices[i];
    customers[idx].fraudFlag = true;
  }

  // 7. Adjust Credit Score and DTI sums to hit exact averages
  // Target average credit score: 599. Sum: 2,995,000
  let currentScoreSum = customers.reduce((sum, c) => sum + c.creditScore, 0);
  let scoreDiff = 2995000 - currentScoreSum;
  while (scoreDiff !== 0) {
    const step = scoreDiff > 0 ? 1 : -1;
    const idx = Math.floor(rand() * N);
    const original = customers[idx].creditScore;
    const nextVal = original + step;
    if (nextVal >= 300 && nextVal <= 850) {
      // Ensure we don't accidentally move people across the 580 Poor boundary which would mess up risk rates
      if ((original < 580 && nextVal < 580) || (original >= 580 && nextVal >= 580)) {
        customers[idx].creditScore = nextVal;
        scoreDiff -= step;
      }
    }
  }

  // Target average DTI: 29.7%. Sum: 148,500 (since DTI is integer in our dataset, let's sum to 148500)
  let currentDtiSum = customers.reduce((sum, c) => sum + c.dti, 0);
  let dtiDiff = 148500 - currentDtiSum;
  while (dtiDiff !== 0) {
    const step = dtiDiff > 0 ? 1 : -1;
    const idx = Math.floor(rand() * N);
    const nextVal = customers[idx].dti + step;
    if (nextVal >= 5 && nextVal <= 80) {
      customers[idx].dti = nextVal;
      dtiDiff -= step;
    }
  }

  return customers;
}

// Export module for Node testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateDataset };
} else {
  window.generateDataset = generateDataset;
}
