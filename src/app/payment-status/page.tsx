"use client";

import { useDonationStore } from "@/stores/donationStore";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Container from "../components/Container";

const Page = () => {
  const txnId = useDonationStore((state) => state.txnId);
  const { wantsReceipt, name, address, contact, pan } = useDonationStore(
    (state) => ({
      wantsReceipt: state.wantsReceipt,
      name: state.name,
      address: state.address,
      contact: state.contact,
      pan: state.pan,
    }),
  );
  const [amount, setAmount] = useState<number | undefined>();
  const [isError, setIsError] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "SUCCESS" | "PENDING" | "FAILED"
  >("PENDING");

  useEffect(() => {
    if (!txnId) return;
    checkStatus();
  }, [txnId]);

  const checkStatus = useCallback(async () => {
    let cnt = 0;
    if (!txnId || isError) return;
    setIsError(false);
    while (true) {
      cnt++;
      if (cnt > 10) {
        setIsError(true);
        break;
      }
      try {
        const delay = new Promise((res) => setTimeout(res, 2 * 1000));
        const response = await axios.get(`/api/status?txnId=${txnId}`);
        const data = response.data;

        const paymentState = data?.data?.state;
        console.log({ paymentState });
        if (paymentState === "COMPLETED") {
          setAmount(data?.data?.amount / 100);
          setPaymentMode(data?.data?.paymentInstrument?.type);
          setPaymentStatus("SUCCESS");
          break;
        }
        if (paymentState === "FAILED") {
          setPaymentStatus("FAILED");
          break;
        }
        await delay;
      } catch (error) {
        console.error(error);
        setIsError(true);
        break;
      }
    }
  }, [txnId]);

  const handleDownload = async () => {
    if (
      !txnId ||
      !pan ||
      !amount ||
      !name ||
      !address ||
      !paymentMode ||
      !contact
    )
      return;
    try {
      const response = await fetch(
        `/api/receipt?txnId=${txnId}&amount=${amount}&name=${name}&contact=${contact}&address=${address}&pan=${pan}&mode=${paymentMode}`,
      );
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
  };

  return (
    <main>
      <Container className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col">
          {isError || paymentStatus == "FAILED" ? (
            <p className="text-center">
              Something went wrong! <br />
              Please contact us at{" "}
              <span className="select-text">selflesssewango@gmail.com</span> and
              mention the transaction id{" "}
              <span className="select-text">{txnId}</span>
            </p>
          ) : paymentStatus === "PENDING" ? (
            <p className="animate-pulse">
              Loading... please do NOT refresh or close this window
            </p>
          ) : (
            <>
              <p className="font-display text-center text-headline-lg font-light">
                Thank you for donating ₹ {amount}.00
              </p>
              <p className="mt-4 text-center text-body-lg font-light tracking-wider">
                Transaction Id: {txnId}
              </p>
              {wantsReceipt &&
                txnId &&
                amount &&
                name &&
                pan &&
                contact &&
                address &&
                paymentMode && (
                  <button onClick={handleDownload}
                    className="mt-4 flex self-center rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
                  >
                    <div className="flex items-center gap-1 rounded-[0.4rem] bg-green-50 px-3 py-1">
                      Download Receipt
                    </div>
                  </button>
                )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
};

export default Page;
