// No @ts-check and no typedefs — pure JavaScript

const NO_CHANGES = {
  operations: [],
};

export function cartTransformRun(input) {
  const operations = input.cart.lines
    .filter((line) =>
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product.title.includes(":")
    )
    .map((line) => ({
      lineUpdate: {
        cartLineId: line.id,
        title: line.merchandise.product.title.split(":")[0],
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: "0.00", // store currency is used automatically
            },
          },
        },
      },
    }));

  // return operations.length > 0
  //   ? { operations }
  //   : NO_CHANGES;
  return NO_CHANGES;
}
