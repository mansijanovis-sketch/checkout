export function run(input, { applyDiscount }) {
  const attr = input.cart.attributes.find(
    (a) => a.key === "makeFree" && a.value === "yes"
  );

  if (attr) {
    applyDiscount({
      targets: [{ orderSubtotal: {} }],
      value: { percentage: { value: 100.0 } },
      message: "Free Order Activated",
    });
  }
}
