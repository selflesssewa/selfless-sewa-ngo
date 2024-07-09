"use client";

import axios from "axios";
import { decodeJwt } from "jose";
import { redirect, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Container from "../components/Container";

const Page = () => {
  return (
    <Suspense
      fallback={
        <main>
          <Container className="flex min-h-[65vh] flex-col items-center">
            <p>loading...</p>
          </Container>
        </main>
      }
    >
      <PageUI />
    </Suspense>
  );
};
function PageUI() {
  const time = useMemo(() => {
    return Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
  }, []);
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  if (!token) return redirect("/");

  const [isError, setIsError] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "SUCCESS" | "PENDING" | "FAILED"
  >("PENDING");

  let data = null;
  try {
    data = decodeJwt(token);
  } catch (e) {
    console.error(e);
    setIsError(true);
    return redirect("/");
  }

  const txnId = data.id;
  const amount = Number(data.a);
  const wantsReceipt = !!data.p;

  const cnt = useRef(0);
  const checkStatus = useCallback(async () => {
    if (isError) return;

    setIsError(false);
    while (true) {
      cnt.current++;
      if (cnt.current > 5) {
        setIsError(true);
        break;
      }
      try {
        const delay = new Promise((res) => setTimeout(res, 5 * 1000));
        const response = await axios.get(`/api/status?t=${token}`);
        const data = response.data;

        const paymentState = data?.data?.state;
        if (paymentState === "COMPLETED") {
          setPaymentStatus("SUCCESS");
          break;
        } else if (paymentState === "FAILED") {
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
  }, [token, isError]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/receipt?t=${token}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
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
      <Container className="flex min-h-[80vh] items-center justify-center py-21 selection:bg-dark-text-selection">
        <div className="flex flex-col">
          {isError || paymentStatus == "FAILED" ? (
            <p className="text-center">
              <span className="mb-4 block text-title-lg font-medium">
                Something went wrong!
              </span>
              Please contact us at{" "}
              <span className="select-text">selflesssewango@gmail.com</span> and
              mention the transaction id
              <span className="mt-2 block select-text font-medium tracking-wider">
                {txnId}
              </span>
            </p>
          ) : paymentStatus === "PENDING" ? (
            <p className="animate-pulse">
              Loading... please do NOT refresh or close this window
            </p>
          ) : (
            <>
              <p className="font-display text-balance text-center text-headline-lg font-light leading-none">
                Thank you for donating ₹{amount.toFixed(2)}
              </p>
              <p className="mt-4 text-center text-body-lg font-light tracking-wider">
                Transaction Id: {txnId}
              </p>
              <p className="mt-2 text-center text-body-lg font-light tracking-wider">
                {time}
              </p>
              {wantsReceipt && (
                <div className="mt-8 flex flex-col gap-2">
                  <p className="text-center text-body-lg font-light tracking-wider">
                    Please download the receipt, it will not be available later.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex self-center rounded-[0.8rem] bg-blue-60 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
                  >
                    <div className="flex items-center gap-1 rounded-[0.4rem] bg-blue px-3 py-1">
                      Download Receipt
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

export default Page;
