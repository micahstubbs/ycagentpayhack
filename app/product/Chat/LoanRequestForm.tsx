"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../../../convex/_generated/api";

export function LoanRequestForm() {
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [debtorAddress, setDebtorAddress] = useState("");
  const [daysUntilDue, setDaysUntilDue] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLoanRequest = useMutation(api.loans.create);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const loanRequestId = await createLoanRequest({
        invoiceAmount: parseFloat(invoiceAmount),
        loanAmount: parseFloat(loanAmount),
        debtorAddress,
        daysUntilDue: parseInt(daysUntilDue),
        purpose,
      });

      console.log("Loan request created:", loanRequestId);

      // Reset form
      setInvoiceAmount("");
      setLoanAmount("");
      setDebtorAddress("");
      setDaysUntilDue("");
      setPurpose("");

      alert(`Loan request submitted! AI agents are now processing your request through the 8-step workflow.`);
    } catch (error: any) {
      console.error("Failed to create loan request:", error);
      if (error.message?.includes("authentication") || error.message?.includes("unauthorized")) {
        alert("Please sign in to submit loan requests. Sign in to track your loan through the AI agent workflow.");
      } else {
        alert("Failed to create loan request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Request Invoice-Backed Loan</h2>
      <p className="text-sm text-gray-600 mb-6">
        Submit your invoice details and our AI agents will autonomously process your loan request through an 8-step workflow.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="invoiceAmount">Invoice Amount ($)</Label>
          <Input
            id="invoiceAmount"
            type="number"
            step="0.01"
            min="0"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
            placeholder="1000.00"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Total amount your customer owes</p>
        </div>

        <div>
          <Label htmlFor="loanAmount">Loan Amount Requested ($)</Label>
          <Input
            id="loanAmount"
            type="number"
            step="0.01"
            min="0"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="800.00"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Amount you need now (typically 70-90% of invoice)</p>
        </div>

        <div>
          <Label htmlFor="debtorAddress">Customer Wallet Address</Label>
          <Input
            id="debtorAddress"
            type="text"
            value={debtorAddress}
            onChange={(e) => setDebtorAddress(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Blockchain address of customer who owes payment</p>
        </div>

        <div>
          <Label htmlFor="daysUntilDue">Days Until Invoice Due</Label>
          <Input
            id="daysUntilDue"
            type="number"
            min="1"
            value={daysUntilDue}
            onChange={(e) => setDaysUntilDue(e.target.value)}
            placeholder="30"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Number of days until customer payment is due</p>
        </div>

        <div>
          <Label htmlFor="purpose">Loan Purpose</Label>
          <Textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Rent H200 GPU compute for AI model training"
            rows={3}
            required
          />
          <p className="text-xs text-gray-500 mt-1">What will you use the loan for?</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting to AI Agents..." : "Submit Loan Request"}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">How It Works:</h3>
        <ol className="text-xs space-y-1 text-gray-700">
          <li>1. Business Agent mints your invoice as an NFT</li>
          <li>2. Lender Agent receives and validates your request</li>
          <li>3. Analyst Agent performs credit analysis</li>
          <li>4. Lender Agent approves and disburses loan</li>
          <li>5-8. Automatic loan settlement when invoice is paid</li>
        </ol>
      </div>
    </div>
  );
}
