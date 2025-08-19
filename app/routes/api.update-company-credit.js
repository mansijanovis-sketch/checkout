import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { companyId, remainingCredit } = await request.json();

  const mutation = `
    mutation SetCreditMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      metafields: [
        {
          ownerId: companyId,
          namespace: "custom",
          key: "company_credit",
          type: "single_line_text_field",
          value: remainingCredit.toString(),
        },
      ],
    },
  });

  return new Response(JSON.stringify(response), { status: 200 });
};
