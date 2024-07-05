import { redirect } from "next/navigation";
import Container from "../components/Container";

const Page = ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const txnId = searchParams["t"];
  const amount = searchParams["a"];

  if (!txnId || !amount) {
    redirect("/");
  }

  return (
    <main>
      <Container className="flex min-h-[80vh] items-center justify-center">
        <div>
          <p className="font-display text-center text-headline-lg font-light">
            Thank you for donating ₹ {amount}.00
          </p>
          <p className="mt-4 text-center text-body-lg font-light tracking-wider">
            Transaction Id: {txnId}
          </p>
        </div>
      </Container>
    </main>
  );
};

export default Page;
