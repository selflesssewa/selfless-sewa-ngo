"use client";

import React, { useState, useEffect } from "react";
import Container from "../components/Container";
import CryptoJS from "crypto-js";

const Page = () => {
  const [transactionId, setTransactionId] = useState<string>("");
  const [responseData, setResponseData] = useState<any>(null);

  useEffect(() => {
    const parseUrlParams = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get("transactionId");
      if (id) {
        setTransactionId(id);
      }
    };

    parseUrlParams();
  }, []);

  useEffect(() => {
    if (transactionId) {
      handleSubmit();
    }
  }, [transactionId]);

  const handleSubmit = async () => {
    const merchantId = 'M22GE2J7US8VN';
    const saltKey = 'fe68dfe6-a825-4479-8b54-9989aec729d6';
    const saltIndex = '1';
    const merchantUserId = 'MUID123';
    const apiUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${transactionId}`;

    const checksum = CryptoJS.SHA256(`/v4/transaction/${merchantId}/${transactionId}` + saltKey).toString() + "###" + saltIndex;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      }
    };

    try {
      const response = await fetch(apiUrl, options);
      const responseData = await response.json();
      setResponseData(responseData);
      console.log(responseData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main className="min-h-screen">
      <Container className="mb-21 mt-12">
        <p>Transaction ID: {transactionId}</p>
        {responseData && (
          <div>
            <p>Response Data:</p>
            <pre>{JSON.stringify(responseData, null, 2)}</pre>
          </div>
        )}
      </Container>
    </main>
  );
};

export default Page;
