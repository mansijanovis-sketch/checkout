import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  useAppMetafields,
  useApi,
  useMetafields,
  useCartLines,
  useTotalAmount,
  Checkbox,
  useApplyAttributeChange,
  useAttributes,
  usePurchasingCompany,
  useApplyMetafieldsChange
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { buyerIdentity } = useApi();
  const appMetafields = useAppMetafields();
  const totalAmount = useTotalAmount();
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();
  const companyCreditValue =
    appMetafields && appMetafields.length > 0 && appMetafields[0]?.metafield?.value
    && appMetafields[0].metafield.value;
  // console.log("===", appMetafields[0]?.metafield, totalAmount)
  const currentCredit = parseInt(companyCreditValue) || 0;

  const rawCompanyId = buyerIdentity?.purchasingCompany?.current?.company?.id;
  const companyId = rawCompanyId?.match(/Company\/(\d+)/)?.[1];
  const companyName = buyerIdentity?.purchasingCompany?.current?.company?.name ?? "Company";
  // Calculate order & credit
  const orderTotal = parseFloat(totalAmount?.amount || 0);
  const remainingCredit = Math.max(currentCredit - orderTotal, 0);
  const creditCoversFullOrder = currentCredit >= orderTotal;
  const creditCoversPartialOrder = currentCredit > 0 && currentCredit < orderTotal;
  const remainingPaymentNeeded = Math.max(orderTotal - currentCredit, 0).toFixed(2);
  const newCredit = Math.max(currentCredit - orderTotal, 0).toFixed(2)

  const handleStoreCreditChange = async (isChecked) => {
    if (isChecked) {
      await applyAttributeChange({ key: "use_store_credit", type: "updateAttribute", value: "true" });
      await applyAttributeChange({ key: "store_credit_amount", type: "updateAttribute", value: currentCredit.toString() });
      await applyAttributeChange({ key: "remain_store_credit_amount", type: "updateAttribute", value: newCredit.toString() });
      await applyAttributeChange({ key: "order_total", type: "updateAttribute", value: orderTotal.toString() });
      await applyAttributeChange({ key: "remain_credit", type: "updateAttribute", value: remainingCredit.toString() });
    } else {
      await applyAttributeChange({ key: "use_store_credit", type: "updateAttribute", value: "false" });
      await applyAttributeChange({ key: "store_credit_amount", type: "updateAttribute", value: companyCreditValue.toString() });
      await applyAttributeChange({ key: "remain_store_credit_amount", type: "updateAttribute", value: newCredit.toString() });
      await applyAttributeChange({ key: "order_total", type: "updateAttribute", value: orderTotal.toString() });
      await applyAttributeChange({ key: "remain_credit", type: "updateAttribute", value: currentCredit.toString() });
    }

  };


  return (
    <BlockStack padding="tight">
      <Banner title="Company Store Credit" status="info">
        {currentCredit > 0 && currentCredit != "" ? (
          <>
            <Text>Available company credit for {companyName}: ₹{currentCredit}</Text>
            {orderTotal > 0 && <Text> Order Total: ₹{orderTotal}</Text>}

            {creditCoversFullOrder ? (
              <>
                <Text>✅ Credit covers full order! No payment needed.</Text>
                <Text> Remaining Credit: ₹{newCredit}</Text>
              </>
            ) : creditCoversPartialOrder ? (
              <>
                <Text>💰 Partial credit available! Use ₹{currentCredit} from credit</Text>
                <Text> Remaining Payment: ₹{newCredit}</Text>
              </>
            ) : (
              <Text>❌ Insufficient Credit</Text>
            )}

            <Checkbox
              onChange={handleStoreCreditChange}
              name="use_store_credit"
              checked={attributes?.find(attr => attr.key === 'use_store_credit')?.value === 'true'}
            >
              {creditCoversFullOrder
                ? `Apply Store Credit (₹${orderTotal})`
                : `Apply Partial Store Credit (₹${currentCredit}) - Pay ₹${remainingPaymentNeeded}`}
            </Checkbox>
          </>
        ) : (
          <Text>No company credit available</Text>
        )}
      </Banner>
    </BlockStack>
  );
}
