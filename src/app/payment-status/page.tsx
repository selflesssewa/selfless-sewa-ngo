"use client";

import axios from "axios";
import { decodeJwt } from "jose";
import { useRouter, useSearchParams } from "next/navigation";
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
          <Container className="flex min-h-[65vh] flex-col items-center justify-center">
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const subscriptionId = searchParams.get("sub");

  const isRecurring = !!subscriptionId;

  const [isError, setIsError] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "SUCCESS" | "PENDING" | "FAILED"
  >("PENDING");
  // Recurring-only details, fetched from the subscription status endpoint.
  const [recurringAmount, setRecurringAmount] = useState<number | null>(null);
  const [recurringFrequency, setRecurringFrequency] = useState<string | null>(
    null,
  );

  const checkStatus = useCallback(async () => {
    if (isError) return;

    setIsError(false);
    const endpoint = isRecurring
      ? `/api/subscription/status?sub=${subscriptionId}`
      : `/api/status?t=${token}`;

    while (true) {
      cnt.current++;
      if (cnt.current > 5) {
        setIsError(true);
        break;
      }
      try {
        const delay = new Promise((res) => setTimeout(res, 5 * 1000));
        const response = await axios.get(endpoint);
        const data = response.data;

        // One-time: check data?.data?.state
        // Recurring: check data?.status (or data?.state)
        const state = isRecurring
          ? data?.status ?? data?.state
          : data?.data?.state;

        if (isRecurring) {
          if (typeof data?.amount === "number") setRecurringAmount(data.amount);
          if (typeof data?.frequency === "string")
            setRecurringFrequency(data.frequency);
        }

        if (state === "COMPLETED" || state === "ACTIVE") {
          setPaymentStatus("SUCCESS");
          break;
        } else if (state === "FAILED") {
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
  }, [token, subscriptionId, isError, isRecurring]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const cnt = useRef(0);

  const time = useMemo(() => {
    return Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
  }, []);

  if (!token && !subscriptionId) {
    router.replace("/");
    return null;
  }
  let data = null;
  if (token) {
    try {
      data = decodeJwt(token);
    } catch (e) {
      router.replace("/");
      return null;
    }
  }

  const txnId = data?.id ?? subscriptionId;
  const amount = Number(data?.a) || 0;
  const wantsReceipt = !!data?.p;

  const frequencyLabel: Record<string, string> = {
    MONTHLY: "monthly",
    QUARTERLY: "every 3 months",
    HALFYEARLY: "every 6 months",
    YEARLY: "yearly",
  };

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
          ) : isRecurring ? (
            <>
              <p className="font-display text-balance text-center text-headline-lg font-light leading-none">
                Your{" "}
                {recurringFrequency
                  ? frequencyLabel[recurringFrequency] ?? "recurring"
                  : "recurring"}{" "}
                donation
                {recurringAmount ? ` of ₹${recurringAmount}` : ""} is set up!
              </p>
              <p className="mt-4 text-balance text-center text-body-lg font-light tracking-wider text-white-70">
                Thank you for your ongoing support. Your first contribution has
                been received; you&apos;ll be charged automatically each month
                and can cancel anytime.
              </p>
              <p className="mt-4 text-center text-body-lg font-light tracking-wider">
                Reference Id: {txnId}
              </p>
              <p className="mt-2 text-center text-body-lg font-light tracking-wider">
                {time}
              </p>
            </>
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
          {paymentStatus === "SUCCESS" && !isError && (
            <a
              href="/"
              className="mt-10 self-center rounded-[0.8rem] border border-white-30 px-5 py-2 text-body-lg font-light tracking-wider transition-colors hover:bg-white-10"
            >
              Back to Home
            </a>
          )}
        </div>
      </Container>
    </main>
  );
}

export default Page;
