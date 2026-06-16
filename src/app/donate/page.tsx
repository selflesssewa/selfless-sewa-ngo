"use client";

import { TFrequency, useDonationStore } from "@/stores/donationStore";
import { useLayoutEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import Container from "../components/Container";
import GlowCard from "../components/GlowCard";

const Page = () => {
  const resetFormState = useDonationStore((state) => state.resetStore);
  const amount = useDonationStore((state) => state.amount);
  const isRecurring = useDonationStore((state) => state.isRecurring);
  const setIsRecurring = useDonationStore((state) => state.setIsRecurring);
  const frequency = useDonationStore((state) => state.frequency);
  const setFrequency = useDonationStore((state) => state.setFrequency);
  const wantsReceipt = useDonationStore((state) => state.wantsReceipt);
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
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useLayoutEffect(() => {
    resetFormState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isSubmitting) return;

    if (isRecurring) {
      alert(
        "Recurring donations are coming soon. Please choose “Give once” for now.",
      );
      return;
    }

    if (!hasAcknowledged) {
      alert("Please confirm the acknowledgement.");
      return;
    }

    if (wantsReceipt && (!name || !contact || !pan || !address)) {
      alert("Please fill in all details for receipt.");
      return;
    }

    let response = null;

    setIsSubmitting(true);

    const query = new URLSearchParams(
      wantsReceipt ? { pan, name, contact, address, amount } : { amount },
    );

    response = await fetch(`/api/pay?${query.toString()}`);

    const paymentData = await response.json();

    if (paymentData == null) {
      console.log("error");
    } else {
      setTxnId(paymentData["txnId"]);
      window.location.href = paymentData["paymentUrl"];
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-[65vh]">
      <Container className="mb-21 mt-12 flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[480px] [&_input]:placeholder:text-white-70 [&_textarea]:placeholder:text-white-70"
        >
          <fieldset
            className="flex flex-col items-stretch gap-4 [&_label]:text-title-sm [&_label]:font-medium"
            disabled={isSubmitting}
          >
            <div className="flex gap-1 rounded-[0.9rem] bg-blue-30 p-1">
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                aria-pressed={!isRecurring}
                className={twMerge(
                  "flex-1 rounded-[0.6rem] py-2 text-title-sm font-medium transition-colors",
                  !isRecurring ? "bg-green-50 text-white" : "text-white-70",
                )}
              >
                Give once
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                aria-pressed={isRecurring}
                className={twMerge(
                  "flex-1 rounded-[0.6rem] py-2 text-title-sm font-medium transition-colors",
                  isRecurring ? "bg-green-50 text-white" : "text-white-70",
                )}
              >
                Give recurring
              </button>
            </div>
            {isRecurring && (
              <>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="frequency">Frequency</label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as TFrequency)
                    }
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none [&>option]:text-black"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Every 3 months</option>
                    <option value="HALFYEARLY">Every 6 months</option>
                    <option value="YEARLY">Annually</option>
                  </select>
                </GlowCard>
                <p className="px-3 text-body-sm text-white-70">
                  Recurring giving is coming soon. We’ll charge your chosen
                  amount automatically at the selected frequency once it’s live.
                </p>
              </>
            )}
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
            <label htmlFor="receipt" className="flex items-center gap-2 px-3">
              <input
                type="checkbox"
                id="receipt"
                checked={wantsReceipt}
                onChange={(e) => toggleWantsReceipt(e.target.checked)}
              />
              <span>Would you like a receipt?</span>
            </label>
            {wantsReceipt && (
              <>
                <GlowCard className="flex flex-col gap-2 p-3 pb-1">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    min={2}
                    max={25}
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
                    rows={3}
                    maxLength={35}
                    placeholder="Your address"
                    value={address}
                    onChange={(e) => updateAddress(e.target.value)}
                    required
                    className="w-full rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                  />
                </GlowCard>
              </>
            )}

            <label
              htmlFor="acknowledge"
              className="flex items-start gap-2 px-3"
            >
              <input
                type="checkbox"
                id="acknowledge"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.currentTarget.checked)}
                className="size-4"
              />
              <span className="max-w-prose text-pretty">
                I hereby acknowledge that I have willingly made a donation to
                Selfless Sewa NGO. I understand that my contribution will go
                towards fulfilling the needs of those in need and for the
                betterment of society.
              </span>
            </label>
            <button
              type="submit"
              className="mt-4 flex self-center rounded-[0.8rem] bg-green-50 p-1 shadow-sm backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
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
