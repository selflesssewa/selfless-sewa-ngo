"use client";

import { useDonationStore } from "@/stores/donationStore";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Container from "../components/Container";

const Page = () => {
  const txnId = useDonationStore((state) => state.txnId);
  const amount = useDonationStore((state) => state.amount);

  console.log({ txnId, amount });

  const [paymentStatus, setPaymentStatus] = useState<
    "DONE" | "PENDING" | "FAILED"
  >("PENDING");

  useEffect(() => {
    if (!txnId) return;
    checkStatus();
  }, [txnId]);

  useEffect(() => {
    return () => useDonationStore.persist.clearStorage();
  }, []);

  const checkStatus = useCallback(async () => {
    if (!txnId) return;

    while (true) {
      try {
        const delay = new Promise((res) => setTimeout(res, 2000));
        const response = await axios.get(`/api/status?txnId=${txnId}`);
        const data = response.data;
        console.log(data);
        await delay;
        setPaymentStatus("DONE");
        break;
      } catch (error) {
        console.error(error);
        setPaymentStatus("FAILED");
        break;
      }
    }
  }, [txnId]);

  const handleDownload = useCallback(async () => {
    if (!txnId) return;
    try {
      const response = await fetch(`/api/receipt`);
      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      let alink = document.createElement("a");
      alink.href = fileURL;
      alink.download = `receipt_${txnId}.pdf`;
      alink.click();
      console.log(fileURL);
    } catch (error) {
      console.error(error);
    }
  }, [txnId]);

  const isError = !txnId || !amount;

  return (
    <main>
      <Container className="flex min-h-[80vh] items-center justify-center">
        <div>
          {isError ? (
            <p>Something went wrong!</p>
          ) : (
            <>
              <p className="font-display text-center text-headline-lg font-light">
                Thank you for donating ₹ {amount}.00
              </p>
              <p className="mt-4 text-center text-body-lg font-light tracking-wider">
                Transaction Id: {txnId}
              </p>
            </>
          )}
        </div>
        {/* {!isError && <button onClick={handleDownload}>Download Receipt</button>} */}
        <button onClick={handleDownload}>Download Receipt</button>
        <p>{paymentStatus}</p>
      </Container>
    </main>
  );
};

export default Page;
