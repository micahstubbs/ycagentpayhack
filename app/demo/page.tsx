"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Send, 
  BarChart3, 
  Lock, 
  Cpu, 
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  from?: string;
  to?: string;
  amount?: string;
  details: string[];
}

const steps: Step[] = [
  {
    id: 1,
    title: "Fund Lender Agent",
    description: "User transfers $1000 via Stripe to fund the Lender Agent",
    action: "Transfer $1000",
    icon: <DollarSign className="h-8 w-8" />,
    from: "User (Stripe)",
    to: "Lender Agent (Locus)",
    amount: "1000 USDC",
    details: [
      "User pays $1000 with credit card via Stripe",
      "Stripe webhook triggers transfer to Connect account",
      "Convex backend converts 1:1 USD to USDC",
      "Locus deposits 1000 USDC to Lender wallet"
    ]
  },
  {
    id: 2,
    title: "Mint Invoice NFT",
    description: "Business Agent creates an invoice NFT on Base blockchain",
    action: "Mint NFT",
    icon: <FileText className="h-8 w-8" />,
    from: "Business Agent",
    to: "Base Blockchain",
    amount: "$1000 invoice",
    details: [
      "Business Agent calls InvoiceNFT.mint()",
      "Invoice: $1000, due in 30 days",
      "Debtor: 0x1234...7890",
      "NFT #0 minted and owned by Business Agent"
    ]
  },
  {
    id: 3,
    title: "Request Loan",
    description: "Business Agent requests $800 loan against invoice collateral",
    action: "Request Loan",
    icon: <MessageSquare className="h-8 w-8" />,
    from: "Business Agent",
    to: "Lender Agent",
    amount: "$800 loan",
    details: [
      "Business needs $800 for H200 compute rental",
      "Offers Invoice NFT #0 as collateral",
      "Loan-to-value ratio: 80%",
      "Lender requests credit analysis"
    ]
  },
  {
    id: 4,
    title: "Pay for Credit Analysis",
    description: "Lender pays Analyst 20 USDC for creditworthiness report",
    action: "Transfer 20 USDC",
    icon: <Send className="h-8 w-8" />,
    from: "Lender Agent",
    to: "Analyst Agent",
    amount: "20 USDC",
    details: [
      "Lender transfers 20 USDC via Locus",
      "Lender balance: 1000 → 980 USDC",
      "Analyst balance: 0 → 20 USDC",
      "Analyst begins credit analysis"
    ]
  },
  {
    id: 5,
    title: "Credit Analysis",
    description: "Analyst Agent analyzes debtor and provides loan recommendation",
    action: "Analyze Credit",
    icon: <BarChart3 className="h-8 w-8" />,
    from: "Analyst Agent",
    to: "Lender Agent",
    amount: "Credit Report",
    details: [
      "Analyst reviews invoice details",
      "Risk assessment: 7/10",
      "Recommendation: 80% advance rate",
      "Interest rate: 5% (40 USDC)"
    ]
  },
  {
    id: 6,
    title: "Execute Loan",
    description: "Lender creates loan on Base, locks NFT, transfers 800 USDC",
    action: "Create Loan",
    icon: <Lock className="h-8 w-8" />,
    from: "Lender Agent",
    to: "Business Agent",
    amount: "800 USDC",
    details: [
      "Business approves NFT transfer to escrow",
      "Lender calls LoanEscrow.createLoan()",
      "Invoice NFT #0 locked in smart contract",
      "800 USDC transferred to Business Agent"
    ]
  },
  {
    id: 7,
    title: "Pay for Compute",
    description: "Business Agent pays 800 USDC for H200 GPU rental",
    action: "Transfer 800 USDC",
    icon: <Cpu className="h-8 w-8" />,
    from: "Business Agent",
    to: "Compute Provider",
    amount: "800 USDC",
    details: [
      "Business transfers 800 USDC via Locus",
      "Business balance: 800 → 0 USDC",
      "Compute Provider balance: 0 → 800 USDC",
      "H200 GPU rental activated"
    ]
  },
  {
    id: 8,
    title: "Settle Loan",
    description: "Debtor pays invoice, Business repays loan, NFT returned",
    action: "Settle Loan",
    icon: <CheckCircle2 className="h-8 w-8" />,
    from: "Business Agent",
    to: "Lender Agent",
    amount: "840 USDC",
    details: [
      "Debtor pays 1000 USDC to Business",
      "Business calls LoanEscrow.settleLoan()",
      "Lender receives 840 USDC (800 + 40 interest)",
      "Business keeps 160 USDC profit, NFT returned"
    ]
  }
];

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const handleAutoPlay = () => {
    setIsPlaying(true);
    let step = currentStep;
    const interval = setInterval(() => {
      if (step < steps.length - 1) {
        setCompletedSteps(prev => [...prev, step]);
        step++;
        setCurrentStep(step);
      } else {
        setCompletedSteps(prev => [...prev, step]);
        setIsPlaying(false);
        clearInterval(interval);
      }
    }, 3000);
  };

  const step = steps[currentStep];
  const progress = ((completedSteps.length) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Interactive Demo</h1>
              <p className="text-sm text-muted-foreground">
                Step through the invoice-backed lending flow
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              {!isPlaying && currentStep < steps.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPlay}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Auto Play
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Step */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Card */}
            <div className="border rounded-lg p-8 bg-card">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-lg bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {step.id}
                    </span>
                    {completedSteps.includes(currentStep) && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-3">{step.title}</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {step.description}
                  </p>

                  {/* Transaction Details */}
                  {step.from && step.to && (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-6">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-1">From</div>
                        <div className="font-semibold">{step.from}</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-1">To</div>
                        <div className="font-semibold">{step.to}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Amount</div>
                        <div className="font-bold text-primary">{step.amount}</div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {!completedSteps.includes(currentStep) && (
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={isPlaying}
                      className="w-full"
                    >
                      {step.action}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}

                  {completedSteps.includes(currentStep) && currentStep < steps.length - 1 && (
                    <Button
                      size="lg"
                      onClick={handleNext}
                      variant="outline"
                      className="w-full"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}

                  {completedSteps.includes(currentStep) && currentStep === steps.length - 1 && (
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Demo Complete!</h3>
                      <p className="text-muted-foreground mb-4">
                        You've successfully completed the full lending flow
                      </p>
                      <Button onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Start Over
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">What Happens</h3>
              <ul className="space-y-3">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">All Steps</h3>
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  if (idx <= completedSteps.length) {
                    setCurrentStep(idx);
                  }
                }}
                disabled={idx > completedSteps.length}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  idx === currentStep
                    ? "border-primary bg-primary/5"
                    : completedSteps.includes(idx)
                    ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                    : idx > completedSteps.length
                    ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    idx === currentStep
                      ? "bg-primary/10 text-primary"
                      : completedSteps.includes(idx)
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {completedSteps.includes(idx) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 flex items-center justify-center text-xs font-bold">
                        {s.id}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.title}</div>
                    {s.amount && (
                      <div className="text-xs text-muted-foreground">{s.amount}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
