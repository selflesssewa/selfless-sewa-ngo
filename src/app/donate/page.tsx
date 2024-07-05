"use client";

import React, { useState } from "react";
import Container from "../components/Container";

const Page = () => {
  const [donationAmount, setDonationAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonationAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const response = await fetch(`/api/pay?amount=${donationAmount}`);
    const paymentData = await response.json();
    
    if (paymentData == null) {
      console.log("error")
    } else {
      window.location.href = paymentData["paymentUrl"]
    }
  };
  
  return (
    <main className="min-h-screen">
      <Container className="mb-21 mt-12">
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', marginBottom: '1rem', width: '100%' }}>
            <label htmlFor="amount" style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>
              ₹
            </label>
            <input
              type="number"
              id="amount"
              placeholder="Amount"
              value={donationAmount}
              onChange={handleAmountChange}
              required
              style={{
                color: '#000',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                margin: '20px',
                border: '1px solid #ccc',
                flex: '1',
              }}
            />
            <button 
              type="submit" 
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                margin: '20px',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
            >
              Donate
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
};

export default Page;
