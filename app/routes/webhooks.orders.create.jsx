import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log("Webhook received:", topic, shop);

  // note_attributes are directly on the order
  const attributes = payload?.note_attributes || [];
  const useCredit =
    attributes.find(a => a.name === "use_store_credit")?.value === "true";
  const remainingCredit = attributes.find(a => a.name === "remain_credit")?.value;

  // B2B company ID in Orders API
  const companyId =
    payload?.buyer_identity?.purchasing_company?.company?.id || null;

  console.log("useCredit:", useCredit);
  console.log("remainingCredit:", remainingCredit);
  console.log("companyId:", companyId);

  if (useCredit && companyId) {
    const mutation = `
      mutation SetCreditMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }
    `;

    const response = await session.admin.graphql(mutation, {
      variables: {
        metafields: [
          {
            ownerId: companyId,
            namespace: "custom",
            key: "company_credit",
            type: "single_line_text_field",
            value: remainingCredit || "0",
          },
        ],
      },
    });

    const result = await response.json();
    console.log("Metafield update result:", result);
  }

  return new Response("ok");
};
