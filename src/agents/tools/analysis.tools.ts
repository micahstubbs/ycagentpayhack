/**
 * Credit Analysis Tools
 *
 * Tools for analyzing invoice creditworthiness and calculating risk scores.
 * Used by the Analyst Agent.
 */

import { baseService } from '../../services/base.service';

export const analysisTools = [
  {
    name: 'analyze_invoice',
    description: `Analyze an invoice NFT for creditworthiness.
Returns a credit score (1-10) and loan recommendation.
Only the Analyst Agent should use this tool.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        invoice_token_id: {
          type: 'number',
          description: 'Token ID of the invoice NFT to analyze'
        },
        requested_loan_amount_eth: {
          type: 'number',
          description: 'Amount the borrower is requesting to borrow'
        }
      },
      required: ['invoice_token_id', 'requested_loan_amount_eth']
    }
  },
  {
    name: 'calculate_risk_score',
    description: `Calculate a risk score based on loan parameters.
Returns risk level (low/medium/high) and recommended interest rate.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        invoice_amount_eth: {
          type: 'number',
          description: 'Total invoice amount'
        },
        loan_amount_eth: {
          type: 'number',
          description: 'Requested loan amount'
        },
        days_until_due: {
          type: 'number',
          description: 'Days until invoice is due'
        }
      },
      required: ['invoice_amount_eth', 'loan_amount_eth', 'days_until_due']
    }
  }
];

export async function executeAnalysisTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'analyze_invoice':
      return await analyzeInvoice(
        toolInput.invoice_token_id,
        toolInput.requested_loan_amount_eth
      );

    case 'calculate_risk_score':
      return calculateRiskScore(
        toolInput.invoice_amount_eth,
        toolInput.loan_amount_eth,
        toolInput.days_until_due
      );

    default:
      throw new Error(`Unknown analysis tool: ${toolName}`);
  }
}

/**
 * Analyze an invoice for creditworthiness
 */
async function analyzeInvoice(tokenId: number, requestedAmount: number): Promise<any> {
  // Get invoice details
  const invoice = await baseService.getInvoiceDetails(tokenId);

  const invoiceAmount = parseFloat(invoice.amount);
  const daysUntilDue = invoice.daysUntilDue;

  // Calculate loan-to-value ratio
  const ltv = (requestedAmount / invoiceAmount) * 100;

  // Calculate credit score (1-10)
  let score = 10;

  // Penalize high LTV
  if (ltv > 90) score -= 3;
  else if (ltv > 80) score -= 2;
  else if (ltv > 70) score -= 1;

  // Penalize short time to maturity
  if (daysUntilDue < 15) score -= 2;
  else if (daysUntilDue < 30) score -= 1;

  // Ensure score is in range
  score = Math.max(1, Math.min(10, score));

  // Determine approval
  const approved = score >= 7;

  // Calculate recommended terms
  const maxLoanAmount = invoiceAmount * 0.8; // 80% LTV max
  const recommendedAmount = Math.min(requestedAmount, maxLoanAmount);

  // Interest rate based on risk
  let interestRate = 0.05; // 5% base
  if (score < 7) interestRate = 0.10; // 10% for risky loans
  else if (score < 9) interestRate = 0.07; // 7% for medium risk

  const interestAmount = recommendedAmount * interestRate;

  console.log(`[Analysis] Invoice #${tokenId} Analysis:`);
  console.log(`[Analysis]   Invoice Amount: ${invoiceAmount} ETH`);
  console.log(`[Analysis]   Requested: ${requestedAmount} ETH`);
  console.log(`[Analysis]   LTV: ${ltv.toFixed(1)}%`);
  console.log(`[Analysis]   Days to Maturity: ${daysUntilDue}`);
  console.log(`[Analysis]   Credit Score: ${score}/10`);
  console.log(`[Analysis]   Decision: ${approved ? 'APPROVED' : 'REJECTED'}`);

  return {
    credit_score: score,
    approved,
    recommendation: {
      max_loan_amount: maxLoanAmount,
      recommended_amount: recommendedAmount,
      interest_rate: interestRate,
      interest_amount: interestAmount,
      total_repayment: recommendedAmount + interestAmount,
      reasoning: generateReasoning(score, ltv, daysUntilDue, approved)
    },
    invoice_analysis: {
      invoice_amount: invoiceAmount,
      days_until_due: daysUntilDue,
      loan_to_value_ratio: ltv,
      debtor: invoice.debtor
    }
  };
}

/**
 * Calculate risk score
 */
function calculateRiskScore(
  invoiceAmount: number,
  loanAmount: number,
  daysUntilDue: number
): any {
  const ltv = (loanAmount / invoiceAmount) * 100;

  let riskLevel: 'low' | 'medium' | 'high';
  let recommendedRate: number;

  if (ltv > 85 || daysUntilDue < 15) {
    riskLevel = 'high';
    recommendedRate = 0.10;
  } else if (ltv > 70 || daysUntilDue < 30) {
    riskLevel = 'medium';
    recommendedRate = 0.07;
  } else {
    riskLevel = 'low';
    recommendedRate = 0.05;
  }

  return {
    risk_level: riskLevel,
    loan_to_value: ltv,
    days_to_maturity: daysUntilDue,
    recommended_interest_rate: recommendedRate,
    reasoning: `LTV of ${ltv.toFixed(1)}% and ${daysUntilDue} days to maturity indicates ${riskLevel} risk`
  };
}

/**
 * Generate reasoning text for credit decision
 */
function generateReasoning(
  score: number,
  ltv: number,
  daysUntilDue: number,
  approved: boolean
): string {
  const reasons: string[] = [];

  if (ltv <= 70) {
    reasons.push('Conservative loan-to-value ratio provides good collateral coverage');
  } else if (ltv <= 80) {
    reasons.push('Moderate loan-to-value ratio is acceptable');
  } else {
    reasons.push('High loan-to-value ratio increases risk');
  }

  if (daysUntilDue >= 30) {
    reasons.push('Adequate time to maturity');
  } else if (daysUntilDue >= 15) {
    reasons.push('Moderate time to maturity');
  } else {
    reasons.push('Short time to maturity increases urgency risk');
  }

  if (approved) {
    reasons.push(`APPROVED: Credit score of ${score}/10 meets lending criteria`);
  } else {
    reasons.push(`REJECTED: Credit score of ${score}/10 below approval threshold of 7`);
  }

  return reasons.join('. ') + '.';
}
