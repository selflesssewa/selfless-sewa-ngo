"use client";

import { useDonationStore } from "@/stores/donationStore";
import { useLayoutEffect, useState } from "react";
import Container from "../components/Container";
import GlowCard from "../components/GlowCard";
import { twMerge } from "tailwind-merge";

const Page = () => {
  const resetFormState = useDonationStore((state) => state.resetStore);
  const amount = useDonationStore((state) => state.amount);
  const wantReceipt = useDonationStore((state) => state.wantsReceipt);
  const name = useDonationStore((state) => state.name);
  const contact = useDonationStore((state) => state.contact);
  const pan = useDonationStore((state) => state.pan);
  const address = useDonationStore((state) => state.address);
  const toggleWantsReceipt = useDonationStore(
    (state) => state.toggleWantsReceipt,
  );
  const updateAmount = useDonationStore((state) => state.updateAmount);
  const updateContact = useDonationStore((state) => state.updateContact);
  const updatePan = useDonationStore((state) => state.updatePan);
  const updateAddress = useDonationStore((state) => state.updateAddress);
  const updateName = useDonationStore((state) => state.updateName);
  const setTxnId = useDonationStore((state) => state.setTxnId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLayoutEffect(() => {
    resetFormState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isSubmitting) return;

    if (wantReceipt && (!name || !contact || !pan)) {
      alert("Please fill in all details for receipt.");
      return;
    }

    let response = null;

    setIsSubmitting(true);
    response = await fetch(`/api/pay?amount=${amount}`);

    const paymentData = await response.json();

    if (paymentData == null) {
      console.log("error");
    } else {
      setTxnId(paymentData["txnId"]);
      window.location.href = paymentData["paymentUrl"];
    }
  };

  return (
    <main className="min-h-[65vh]">
      <Container className="mb-21 mt-12 flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[440px] [&_input]:placeholder:text-white-70 [&_textarea]:placeholder:text-white-70"
        >
          <fieldset
            className="flex flex-col items-stretch gap-4 [&_label]:text-title-sm"
            disabled={isSubmitting}
          >
            <GlowCard className="flex items-center gap-2 p-1 ps-3">
              <label htmlFor="amount">₹</label>
              <input
                autoFocus
                type="number"
                id="amount"
                min={1}
                placeholder="Your amount"
                max={10_00_000}
                value={amount}
                onChange={(e) => updateAmount(e.target.value)}
                required
                className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
              />
            </GlowCard>
            <div className="flex items-center gap-2 p-3">
              {/* <label>
              I hereby acknowledge that I have willingly made a donation to
              Selfless Sewa NGO. I understand that my contribution will go
              towards fulfilling the needs of those in need and for the
              betterment of society.
            </label> */}
              <input
                type="checkbox"
                id="receipt"
                checked={wantReceipt}
                onChange={(e) => toggleWantsReceipt(e.target.checked)}
                className="rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
              />
              <label htmlFor="receipt">Would you like a receipt?</label>
            </div>

            {wantReceipt && (
              <>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    placeholder="Your name"
                    onChange={(e) => updateName(e.target.value)}
                    required
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                  />
                </GlowCard>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="pan">PAN</label>
                  <input
                    type="text"
                    id="pan"
                    placeholder="Your PAN"
                    value={pan}
                    onChange={(e) => updatePan(e.target.value)}
                    required
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                  />
                </GlowCard>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="contact">Contact</label>
                  <input
                    type="tel"
                    id="contact"
                    placeholder="Your contact number"
                    value={contact}
                    onChange={(e) => updateContact(e.target.value)}
                    required
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                  />
                </GlowCard>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="pan"
                    rows={5}
                    placeholder="Your address"
                    value={address}
                    onChange={(e) => updateAddress(e.target.value)}
                    required
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                  />
                </GlowCard>
              </>
            )}

            <button
              type="submit"
              className="mt-4 flex self-center rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
            >
              <div className="flex items-center gap-1 rounded-[0.4rem] bg-green-50 px-3 py-1">
                <span
                  className={twMerge(
                    "text-title-md",
                    isSubmitting && "animate-pulse",
                  )}
                >
                  {isSubmitting ? "Loading..." : "Donate"}
                </span>
              </div>
            </button>
          </fieldset>
        </form>
      </Container>
    </main>
  );
};

export default Page;
