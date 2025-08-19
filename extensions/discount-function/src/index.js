export function cartLinesDiscountsGenerateRun(input, { applyDiscount }) {
  console.log("Running cart line discount function...");
  // Example: Apply a 100% discount if attribute is present
  const attr = input.cart.attributes.find(
    (a) => a.key === "makeFree" && a.value === "yes"
  );

  if (attr) {
    for (const line of input.cart.lines) {
      applyDiscount({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { percentage: { value: 100.0 } },
        message: "100% Discount Applied",
      });
    }
  }
}

export function cartDeliveryOptionsDiscountsGenerateRun(input, { applyDiscount }) {
  console.log("Running delivery discount function...");
  // Example: Make delivery free
  for (const option of input.deliveryGroups.flatMap(group => group.deliveryOptions)) {
    applyDiscount({
      targets: [{ deliveryOption: { id: option.id } }],
      value: { percentage: { value: 100.0 } },
      message: "Free Shipping",
    });
  }
}
