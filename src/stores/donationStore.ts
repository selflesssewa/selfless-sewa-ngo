import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TDonationStore = {
  amount: string;
  wantsReceipt: boolean;
  name: string;
  contact: string;
  pan: string;
  address: string;
  txnId?: string;
  toggleWantsReceipt: (checked: boolean) => void;
  updateAmount: (value: string) => void;
  updateName: (value: string) => void;
  updateContact: (value: string) => void;
  updatePan: (value: string) => void;
  updateAddress: (value: string) => void;
  setTxnId: (value: string) => void;
  resetStore: () => void;
};

export const useDonationStore = create<TDonationStore>((set) => ({
  amount: "",
  wantsReceipt: false,
  name: "",
  contact: "",
  pan: "",
  address: "",
  txnId: undefined,
  toggleWantsReceipt: (checked: boolean) =>
    set(() => ({ wantsReceipt: checked })),
  updateAmount: (value: string) => set(() => ({ amount: value })),
  updateName: (value: string) => set(() => ({ name: value })),
  updateContact: (value: string) => set(() => ({ contact: value })),
  updatePan: (value: string) => set(() => ({ pan: value })),
  updateAddress: (value: string) => set(() => ({ address: value })),
  setTxnId: (value: string) => set(() => ({ txnId: value })),
  resetStore: () =>
    set(() => ({
      amount: "",
      wantsReceipt: false,
      name: "",
      contact: "",
      pan: "",
      address: "",
      txnId: undefined,
    })),
}));
