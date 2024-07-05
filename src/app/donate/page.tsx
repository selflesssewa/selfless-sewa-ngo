"use client";

import React, { useState } from "react";
import Container from "../components/Container";
import CryptoJS from "crypto-js";

const Page = () => {
  const [donationAmount, setDonationAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonationAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const apiUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
    const merchantId = 'M22GE2J7US8VN';
    const saltKey = 'fe68dfe6-a825-4479-8b54-9989aec729d6';
    const saltIndex = '1';
    const merchantTransactionId = 'M' + Date.now();
    const merchantUserId = 'MUID123';
    const redirectUrl = `http://selflesssewango.com/payment-status?transactionId=${merchantTransactionId}`;
  
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: parseInt(donationAmount) * 100,
      redirectUrl: redirectUrl,
      redirectMode: 'REDIRECT',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };
  
    const payloadJson = JSON.stringify(payload);
    const base64Payload = btoa(payloadJson);
    const checksum = CryptoJS.SHA256(base64Payload + "/pg/v1/pay" + saltKey).toString() + "###" + saltIndex;
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({
        request: base64Payload
      }),
    };

    try {
      const response = await fetch(apiUrl, options);
      const responseData = await response.json();

      if (responseData.success && responseData.data.instrumentResponse.redirectInfo) {
        const paymentUrl = responseData.data.instrumentResponse.redirectInfo.url;
        window.location.href = paymentUrl;
      } else {
        console.error('Payment initiation failed:', responseData.message);
      }
    } catch (error) {
      console.error('Error:', error);
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
