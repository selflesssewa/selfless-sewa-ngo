"use client";

import React, { useState } from "react";
import Container from "../components/Container";
import GlowCard from "../components/GlowCard";

const Page = () => {
  const [donationAmount, setDonationAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonationAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount) return;
    const response = await fetch(`/api/pay?amount=${donationAmount}`);
    const paymentData = await response.json();

    if (paymentData == null) {
      console.log("error");
    } else {
      window.location.href = paymentData["paymentUrl"];
    }
  };

  return (
    <main className="min-h-screen">
      <Container className="mb-21 mt-12 flex justify-center">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
            <label htmlFor="amount">₹</label>
            <input
              type="number"
              id="amount"
              min={1}
              placeholder="Your amount"
              max={10_00_000}
              value={donationAmount}
              onChange={handleAmountChange}
              required
              className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
            />
            <button
              type="submit"
              className="ms-3 flex self-center rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
            >
              <div className="flex items-center gap-1 rounded-[0.4rem] bg-green-50 px-3 py-1">
                <span className="text-title-md">Donate</span>
              </div>
            </button>
          </GlowCard>
        </form>
      </Container>
    </main>
  );
};

export default Page;
