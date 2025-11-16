"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const WORKFLOW_STEPS = [
  { step: 1, name: "Business Agent Initiates", statuses: ["pending"] },
  { step: 2, name: "Lender Agent Processes", statuses: ["pending_lender"] },
  { step: 3, name: "Analyst Performs Credit Analysis", statuses: ["analyzing"] },
  { step: 4, name: "Lender Executes Loan", statuses: ["pending_approval"] },
  { step: 5, name: "Loan Approved & Disbursed", statuses: ["approved", "disbursed"] },
  { step: 6, name: "Awaiting Customer Payment", statuses: ["disbursed"] },
  { step: 7, name: "Loan Settlement", statuses: ["settling"] },
  { step: 8, name: "Complete", statuses: ["settled", "rejected", "error"] },
];

function getStepStatus(loanStatus: string): number {
  for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
    if (WORKFLOW_STEPS[i].statuses.includes(loanStatus)) {
      return i + 1;
    }
  }
  return 1;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "approved":
    case "disbursed":
    case "settled":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "error":
      return "bg-red-100 text-red-800";
    case "analyzing":
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "pending_lender":
      return "Awaiting Lender";
    case "analyzing":
      return "Under Analysis";
    case "pending_approval":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "disbursed":
      return "Disbursed";
    case "settling":
      return "Settling";
    case "settled":
      return "Settled";
    case "rejected":
      return "Rejected";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function LoanStatusDashboard({ userId }: { userId: Id<"users"> }) {
  const loans = useQuery(api.loans.listByUser);

  if (!loans || loans.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4">Your Loan Requests</h2>
        <p className="text-gray-500">No loan requests yet. Submit your first request above!</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Your Loan Requests</h2>
      <div className="space-y-4">
        {loans.map((loan) => {
          const currentStep = getStepStatus(loan.status);

          return (
            <div key={loan._id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">Loan Request #{loan._id.slice(-6)}</h3>
                  <p className="text-sm text-gray-600">{loan.purpose}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}
                >
                  {getStatusLabel(loan.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Invoice Amount:</span>
                  <span className="ml-2 font-semibold">${loan.invoiceAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Loan Amount:</span>
                  <span className="ml-2 font-semibold">${loan.loanAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days Until Due:</span>
                  <span className="ml-2 font-semibold">{loan.daysUntilDue}</span>
                </div>
                {loan.creditScore && (
                  <div>
                    <span className="text-gray-500">Credit Score:</span>
                    <span className="ml-2 font-semibold">{loan.creditScore}/10</span>
                  </div>
                )}
                {loan.interestRate && (
                  <div>
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="ml-2 font-semibold">{(loan.interestRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Workflow Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600">Workflow Progress</span>
                  <span className="font-semibold">
                    Step {currentStep}/8
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      loan.status === "rejected" || loan.status === "error"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${(currentStep / 8) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {WORKFLOW_STEPS[currentStep - 1]?.name}
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                <span>Created: {new Date(loan.createdAt).toLocaleString()}</span>
                {loan.updatedAt !== loan.createdAt && (
                  <span className="ml-4">
                    Updated: {new Date(loan.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
