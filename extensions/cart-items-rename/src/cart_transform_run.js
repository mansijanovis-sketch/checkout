// No @ts-check and no typedefs — pure JavaScript


const NO_CHANGES = {
  operations: [],
};

export function cartTransformRun(input) {
  const useStoreCredit = input.cart.useStoreCredit?.value === "true";
  const storeCreditAmount = input.cart.storeCreditAmount?.value;
  // const orderAmount = input.cart.orderAmount?.value;
  const orderAmount = input.cart.lines.reduce((sum, line) => {
    const lineTotal = parseFloat(line.cost?.totalAmount?.amount || "0");
    console.log(`Line ${line.id} total:`, lineTotal);
    return sum + lineTotal;
  }, 0);


  console.log(storeCreditAmount, "storeCreditAmount", orderAmount)
  const remain = input.cart.remainCredit?.value;
  const rebetValue = input.cart.rebetValue?.value;
  const rebet = input.cart.rebet?.value;

  console.log(rebet, useStoreCredit, orderAmount, "useStoreCredit", rebetValue, storeCreditAmount)

  const rebetAmount = rebetValue ? Number(rebetValue) : 0;

  let amount = orderAmount;
  if (parseInt(storeCreditAmount) > parseInt(orderAmount)  && useStoreCredit) {
    console.log("credit")
    amount = 0;
  } else if (parseInt(storeCreditAmount) < parseInt(orderAmount)) {
    console.log("small")
    amount = Math.max(orderAmount - storeCreditAmount, 0).toFixed(2)
  } else if (parseInt(rebetAmount) > parseInt(orderAmount) && rebet === "true") {
    console.log("rebet")
    amount = 0;
  }

  console.log(rebetAmount, "amount", amount)

  if (rebet === "true" && storeCreditAmount > 0 && amount != 0) {
    amount = amount - rebetAmount
  }
  // console.log(rebetAmount,"amount", amount)
  // const amount = storeCreditAmount - orderAmount;
  if (useStoreCredit || rebet === "true") {
    const operations = input.cart.lines
      .filter(
        (line) =>
          line.merchandise.__typename === "ProductVariant"
      )
      .map((line) => {
        const newPricePerUnit = (amount / input.cart.lines.length / line.quantity).toFixed(2);
        console.log(newPricePerUnit)
        return {
          lineUpdate: {
            cartLineId: line.id,
            title: line.merchandise.product.title,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: Math.max(0, newPricePerUnit).toFixed(2), // store currency used automatically
                }
              },
            },
          },
        }
      });


    console.log(JSON.stringify(operations))
    return { operations }; // ✅ return object, not array
  } else {
    return NO_CHANGES;
  }
}


// let am = 0;
// let amount = orderAmount;
// if (rebet === "true" && useStoreCredit === true) {
//   // if (orderAmount <= storeCreditAmount) {
//   //   am = 0
//   //   amount = 0;
//   // } else {
//   am = parseInt(storeCreditAmount) + parseInt(rebetAmount);
//   amount = orderAmount - am;
//   // }
// } else if (rebet === "true") {
//   console.log("rebet");
//   console.log(orderAmount,rebetAmount)
//   am = parseInt(rebetAmount);
//   amount = orderAmount - am;
//   console.log(amount)
// } else if (useStoreCredit === true) {
//   am = parseInt(storeCreditAmount);
//   // if (orderAmount < storeCreditAmount) {
//   //   am = 0
//   //   amount = 0;
//   // } else {
//   amount = orderAmount - am;
//   // }
// } else {
//   amount = orderAmount

// }
