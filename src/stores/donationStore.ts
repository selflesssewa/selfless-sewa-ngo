import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TFrequency = "MONTHLY" | "QUARTERLY" | "HALFYEARLY" | "YEARLY";

type TDonationStore = {
  amount: string;
  isRecurring: boolean;
  frequency: TFrequency;
  wantsReceipt: boolean;
  name: string;
  contact: string;
  email: string;
  pan: string;
  address: string;
  txnId?: string;
  setIsRecurring: (value: boolean) => void;
  setFrequency: (value: TFrequency) => void;
  toggleWantsReceipt: (checked: boolean) => void;
  updateAmount: (value: string) => void;
  updateName: (value: string) => void;
  updateContact: (value: string) => void;
  updateEmail: (value: string) => void;
  updatePan: (value: string) => void;
  updateAddress: (value: string) => void;
  setTxnId: (value: string) => void;
  resetStore: () => void;
};

export const useDonationStore = create<TDonationStore>((set) => ({
  amount: "",
  isRecurring: false,
  frequency: "MONTHLY",
  wantsReceipt: false,
  name: "",
  contact: "",
  email: "",
  pan: "",
  address: "",
  txnId: undefined,
  setIsRecurring: (value: boolean) => set(() => ({ isRecurring: value })),
  setFrequency: (value: TFrequency) => set(() => ({ frequency: value })),
  toggleWantsReceipt: (checked: boolean) =>
    set(() => ({ wantsReceipt: checked })),
  updateAmount: (value: string) => set(() => ({ amount: value })),
  updateName: (value: string) => set(() => ({ name: value })),
  updateContact: (value: string) => set(() => ({ contact: value })),
  updateEmail: (value: string) => set(() => ({ email: value })),
  updatePan: (value: string) => set(() => ({ pan: value })),
  updateAddress: (value: string) => set(() => ({ address: value })),
  setTxnId: (value: string) => set(() => ({ txnId: value })),
  resetStore: () =>
    set(() => ({
      amount: "",
      isRecurring: false,
      frequency: "MONTHLY",
      wantsReceipt: false,
      name: "",
      contact: "",
      email: "",
      pan: "",
      address: "",
      txnId: undefined,
    })),
}));
