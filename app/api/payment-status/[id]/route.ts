import { NextRequest, NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import axios from "axios";
import { onPaymentSuccess } from "@/actions/actions";

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.formData();
  // const dataJson = JSON.parse(da);
  console.log(data);

  const userId = data.get("param1");
  console.log("user id : " + userId);
  const status = data.get("code");
  console.log("payment status : " + status);
  const merchantId = data.get("merchantId");
  console.log("merchant id : " + merchantId);
  const transactionId = data.get("transactionId");
  console.log("transaction id : " + transactionId);

  const st =
    `/pg/v1/status/${merchantId}/${transactionId}` +
    process.env.NEXT_PUBLIC_SALT_KEY;
  // console.log(st)
  const dataSha256 = sha256(st);

  const checksum = dataSha256 + "###" + process.env.NEXT_PUBLIC_SALT_INDEX;
  console.log(checksum);

  const options = {
    method: "GET",
    url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };

  // CHECK PAYMENT STATUS
  const response = await axios.request(options);
  console.log("r===", response.data.code);
  console.log(response.data);

  if (response.data.code == "PAYMENT_SUCCESS") {
    if (response.data.data.amount === 9900) {
      console.log("Pro plan");
      const user = await onPaymentSuccess("pro");
      console.log(user);
    } else if (response.data.data.amount === 14900) {
      console.log("Premium plan");
      const user = await onPaymentSuccess("premium");
      console.log(user);
    }
    return NextResponse.redirect("http://localhost:3000/success", {
      status: 301,
    });
  } else
    return NextResponse.redirect("http://localhost:3000/failure", {
      // a 301 status is required to redirect from a POST to a GET route
      status: 301,
    });
}
