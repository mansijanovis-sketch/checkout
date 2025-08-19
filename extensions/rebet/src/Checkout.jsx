import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useTranslate,
  useApplyAttributeChange,
  useInstructions,
  useAppMetafields,
  useAttributes,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();
  const appMetafields = useAppMetafields();
  const attributes = useAttributes();

  if (!instructions.attributes.canUpdateAttributes) {
    return (
      <Banner title="Rebet" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  // get metafield value (read-only, from app config)
  const rebetValue =
    appMetafields.find(
      (m) =>
        m.metafield.namespace === "custom" &&
        m.metafield.key === "rebet_value"
    )?.metafield?.value ?? "0";

  // const rebet =
  //   appMetafields.find(
  //     (m) =>
  //       m.metafield.namespace === "custom" &&
  //       m.metafield.key === "rebet"
  //   )?.metafield?.value ?? "false";

  const onCheckboxChange = async (isChecked) => {
    await applyAttributeChange({
      type: "updateAttribute",
      key: "rebet",
      value: isChecked ? "true" : "false", 
    });

    await applyAttributeChange({
      type: "updateAttribute",
      key: "rebet_value",
      value: rebetValue ? String(rebetValue) : "0", 
    });

  };


  return (
    <BlockStack border="dotted" padding="tight">
      <Banner title="Cash Back">
        <Text emphasis="bold">
          Your previous cashback is ₹{rebetValue}
        </Text>
        <Checkbox
          onChange={onCheckboxChange}
          checked={attributes?.find(attr => attr.key === 'rebet')?.value === 'true'}
        >
          {translate("iWouldLikeAFreeGiftWithMyOrder")}
        </Checkbox>
      </Banner>
    </BlockStack>
  );
}
