import { create } from 'zustand';
import { ActiveLoan, LoanProduct, DailyReport } from '../types';
import { LOAN_PRODUCTS } from '../data/loans';

interface EconomyState {
  cash: number;
  bankBalance: number;
  creditScore: number;
  activeLoans: ActiveLoan[];
  dailyReports: DailyReport[];
  
  // Actions
  addCash: (amount: number) => void;
  deductCash: (amount: number) => boolean;
  takeLoan: (product: LoanProduct) => boolean;
  payLoanDaily: () => { totalPaid: number; missed: number };
  repayFullLoan: (loanId: string) => boolean;
  addDailyReport: (report: DailyReport) => void;
  calculateNetWorth: (equipmentValue: number, propertyValue?: number) => number;
  resetEconomy: () => void;
}

const INITIAL_CASH = 500000;
const INITIAL_CREDIT_SCORE = 500;

export const useEconomyStore = create<EconomyState>((set, get) => ({
  cash: INITIAL_CASH,
  bankBalance: 0,
  creditScore: INITIAL_CREDIT_SCORE,
  activeLoans: [],
  dailyReports: [],

  addCash: (amount: number) => {
    set((state) => ({ cash: state.cash + Math.max(0, amount) }));
  },

  deductCash: (amount: number) => {
    const { cash } = get();
    if (cash >= amount) {
      set({ cash: cash - amount });
      return true;
    }
    return false;
  },

  takeLoan: (product: LoanProduct) => {
    const { creditScore, activeLoans } = get();
    if (creditScore < product.requiredCreditScore) {
      return false;
    }

    const totalToRepay = product.principal * (1 + product.interestRate);
    const newLoan: ActiveLoan = {
      id: `${product.id}_${Date.now()}`,
      title: product.title,
      type: product.type,
      lenderName: product.lenderName,
      principal: product.principal,
      remainingPrincipal: totalToRepay,
      interestRate: product.interestRate,
      dailyPayment: product.dailyPayment,
      totalDays: product.durationDays,
      daysRemaining: product.durationDays,
      missedPayments: 0,
    };

    set((state) => ({
      cash: state.cash + product.principal,
      activeLoans: [...state.activeLoans, newLoan],
      creditScore: product.type === 'bank' ? state.creditScore + 5 : state.creditScore,
    }));
    return true;
  },

  payLoanDaily: () => {
    const { cash, activeLoans } = get();
    let totalPaid = 0;
    let missedCount = 0;
    let currentCash = cash;

    const updatedLoans: ActiveLoan[] = [];

    for (const loan of activeLoans) {
      const paymentNeeded = Math.min(loan.dailyPayment, loan.remainingPrincipal);
      if (currentCash >= paymentNeeded) {
        currentCash -= paymentNeeded;
        totalPaid += paymentNeeded;
        const remaining = loan.remainingPrincipal - paymentNeeded;
        const daysLeft = loan.daysRemaining - 1;

        if (remaining > 0 && daysLeft > 0) {
          updatedLoans.push({
            ...loan,
            remainingPrincipal: remaining,
            daysRemaining: daysLeft,
          });
        }
        // Repaid on time gives slight credit score bonus
      } else {
        // Missed payment!
        missedCount++;
        // Penalty fee 10%
        const penalty = Math.round(paymentNeeded * 0.1);
        updatedLoans.push({
          ...loan,
          remainingPrincipal: loan.remainingPrincipal + penalty,
          missedPayments: loan.missedPayments + 1,
        });
      }
    }

    set((state) => ({
      cash: currentCash,
      activeLoans: updatedLoans,
      creditScore: Math.max(300, Math.min(850, state.creditScore + (missedCount > 0 ? -15 * missedCount : 2))),
    }));

    return { totalPaid, missed: missedCount };
  },

  repayFullLoan: (loanId: string) => {
    const { cash, activeLoans } = get();
    const loan = activeLoans.find((l) => l.id === loanId);
    if (!loan || cash < loan.remainingPrincipal) return false;

    set((state) => ({
      cash: state.cash - loan.remainingPrincipal,
      activeLoans: state.activeLoans.filter((l) => l.id !== loanId),
      creditScore: Math.min(850, state.creditScore + 15),
    }));
    return true;
  },

  addDailyReport: (report: DailyReport) => {
    set((state) => ({
      dailyReports: [report, ...state.dailyReports],
    }));
  },

  calculateNetWorth: (equipmentValue: number, propertyValue: number = 0) => {
    const { cash, bankBalance, activeLoans } = get();
    const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
    return cash + bankBalance + equipmentValue + propertyValue - totalDebt;
  },

  resetEconomy: () => {
    set({
      cash: INITIAL_CASH,
      bankBalance: 0,
      creditScore: INITIAL_CREDIT_SCORE,
      activeLoans: [],
      dailyReports: [],
    });
  },
}));
