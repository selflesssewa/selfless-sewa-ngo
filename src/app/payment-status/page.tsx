"use client";

import { useDonationStore } from "@/stores/donationStore";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Container from "../components/Container";
const POLLING_INTERVAL_MILLIS = 500;

const Page = () => {
  const txnId = useDonationStore((state) => state.txnId);
  const amount = useDonationStore((state) => state.amount);

  console.log({ txnId, amount });

  const [paymentStatus, setPaymentStatus] = useState<
    "DONE" | "PENDING" | "FAILED"
  >("PENDING");

  useEffect(() => {
    if (paymentStatus !== "PENDING" || !txnId) return;
    const intervalId = setInterval(() => {
      checkStatus(txnId);
    }, POLLING_INTERVAL_MILLIS);

    return () => clearInterval(intervalId);
  }, [paymentStatus, txnId]);

  useEffect(() => {
    return () => useDonationStore.persist.clearStorage();
  }, []);

  async function checkStatus(id: string) {
    try {
      const response = await axios.get(`/api/status?txnId=${id}`);
      const data = response.data;
      console.log(data);
      setPaymentStatus("DONE");
    } catch (error) {
      setPaymentStatus("FAILED");
    }
  }

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
