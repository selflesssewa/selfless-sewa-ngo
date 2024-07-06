"use client";

import React, { useState } from "react";
import Container from "../components/Container";
import GlowCard from "../components/GlowCard";

const Page = () => {
  const [donationAmount, setDonationAmount] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [wantReceipt, setWantReceipt] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonationAmount(e.target.value);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContact(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPan(e.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWantReceipt(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount) return;

    if (wantReceipt && (!name || !contact || !pan)) {
      alert("Please fill in all details for receipt.");
      return;
    }

    let response = null;

    if (wantReceipt) {
      response = await fetch(`/api/pay?amount=${donationAmount}&name=${name}&phone=${contact}&addr=${address}&pan=${pan}`);  
    } else {
      response = await fetch(`/api/pay?amount=${donationAmount}`);
    }
    
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
          <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
            <label htmlFor="amount">₹</label>
            <input
              type="number"
              id="amount"
              min={1}
              placeholder="Enter Amount"
              max={1000000}
              value={donationAmount}
              onChange={handleAmountChange}
              required
              className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
            />
          </GlowCard>
          <div className="flex items-center gap-2 p-1 ps-3 text-title-md">
          <label>I hereby acknowledge that I have willingly made a donation to Selfless Sewa NGO. I understand that my contribution will go towards fulfilling the needs of those in need and for the betterment of society.</label>
          <label htmlFor="receipt">Would you like a receipt?</label>
            <input
              type="checkbox"
              id="receipt"
              checked={wantReceipt}
              onChange={handleReceiptChange}
              className="rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
            />
          </div>
          
          {}
          {wantReceipt && (
            <>
              <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter Name"
                  value={name}
                  onChange={handleNameChange}
                  required
                  className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                />
              </GlowCard>
              <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
                <label htmlFor="contact">Contact</label>
                <input
                  type="tel"
                  id="contact"
                  placeholder="Enter Contact"
                  value={contact}
                  onChange={handleContactChange}
                  required
                  className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                />
              </GlowCard>
              <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
                <label htmlFor="pan">PAN Number</label>
                <input
                  type="text"
                  id="pan"
                  placeholder="Enter PAN Number"
                  value={pan}
                  onChange={handlePanChange}
                  required
                  className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                />
              </GlowCard>
              <GlowCard className="flex items-center gap-2 p-1 ps-3 text-title-md">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="pan"
                  placeholder="Enter Address"
                  value={address}
                  onChange={handleAddressChange}
                  required
                  className="min-w-[320px] rounded-[0.8rem] bg-transparent py-2 text-white focus-within:outline-none"
                />
              </GlowCard>
            </>
          )}

          <button
            type="submit"
            className="mt-4 flex self-center rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
          >
            <div className="flex items-center gap-1 rounded-[0.4rem] bg-green-50 px-3 py-1">
              <span className="text-title-md">Donate</span>
            </div>
          </button>
        </form>
      </Container>
    </main>
  );  
};

export default Page;