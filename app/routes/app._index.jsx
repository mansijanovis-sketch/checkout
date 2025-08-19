import { useLoaderData, useFetcher } from "@remix-run/react";
import React, { useState } from 'react';
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  List,
  Button,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const orderResponse = await admin.graphql(`
  query {
    orders(first: 10, query: "financial_status:paid") {
      edges {
        node {
          id
          name
          createdAt
          rebet: metafield(namespace: "custom", key: "rebet") {
            value
          }
          rebetDate: metafield(namespace: "custom", key: "rebet_date") {
            value
          }
          currentTotalPriceSet {
            presentmentMoney {
              amount
            }
          }
          customer {
            id
            email
            firstName
            lastName
          }
        }
      }
    }
  }
`);

  const orderData = await orderResponse.json();
  const orders = orderData.data.orders.edges || [];

  console.log("Orders data:", JSON.stringify(orders[0].node.createdAt));

  // helper for ISO times
  function getCurrentISOTime() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  function getDate30DaysLater(date) {
    const futureDate = new Date(date); // copy to avoid mutating input
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  }


  // const nowISO = getCurrentISOTime();
  // const laterISO = getDate30DaysLater();

  for (const { node } of orders) {
    const rebetValue = node.rebet?.value;
    const currentDate = node.createdAt;

    const laterISO = getDate30DaysLater(currentDate)
    console.log(currentDate, laterISO)

    // Only process orders where rebet == false or not set
    if (!rebetValue || rebetValue === "false") {
      const orderId = node.id;
      const price = node.currentTotalPriceSet.presentmentMoney.amount;

      const rebset = price * 0.1;
      const rebet = rebset.toFixed(2);

      const mutation = `
      mutation UpdateCustomerMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

      const variables = {
        metafields: [
          {
            ownerId: orderId,
            namespace: "custom",
            key: "rebet",
            type: "single_line_text_field",
            value: "true",
          },
          {
            ownerId: orderId,
            namespace: "custom",
            key: "rebet_date",
            type: "single_line_text_field",
            value: laterISO,
          },
          {
            ownerId: orderId,
            namespace: "custom",
            key: "rebet_value",
            type: "single_line_text_field",
            value: rebet.toString(),
          },
        ],
      };

      const updateResult = await admin.graphql(mutation, { variables });
      const updateJson = await updateResult.json();

      console.log(`Metafield update for ${node.name}:`, updateJson.data.metafieldsSet);
    }
  }


  ////confirmmation of mwtafield update
  const response = await admin.graphql(`
    query AllCompanies {
      companies(first: 10) {
        edges {
          node {
            id
            name
            metafield(namespace: "custom", key: "company_credit") {
              value
            }
          }
        }
      }
    }
  `);

  const resJson = await response.json();
  const companies =
    resJson?.data?.companies?.edges.map((edge) => {
      const company = edge.node;
      // console.log("company", company)

      return {
        id: company.id,
        name: company.name,
        credit: company.metafield?.value || "0",
      };
    }) || [];
  return json({ companies, orderData });
};


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const ownerId = formData.get("ownerId"); // company ID
  const newCredit = Number(formData.get("credit")) || 0;

  // === 1. Fetch existing company credit + customer IDs
  const fetchCompanyQuery = `
    query GetCompanyCredit($id: ID!) {
      company(id: $id) {
        metafield(namespace: "custom", key: "company_credit") {
          value
        }
        contacts(first: 50) {
          edges {
            node {
              customer {
                id
              }
            }
          }
        }
      }
    }
  `;

  const fetchResponse = await admin.graphql(fetchCompanyQuery, {
    variables: { id: ownerId },
  });

  const fetchJson = await fetchResponse.json();
  console.log("company--", fetchJson)

  const existingCredit =
    Number(fetchJson?.data?.company?.metafield?.value) || 0;

  const updatedCredit = existingCredit + newCredit;

  const customerIds =
    fetchJson?.data?.company?.contacts?.edges?.map(
      (edge) => edge?.node?.customer?.id
    ) || [];

  // === 2. Create metafield inputs for company and customers
  const metafields = [
    {
      ownerId,
      namespace: "custom",
      key: "company_credit",
      type: "single_line_text_field",
      value: updatedCredit.toString(),
    },
    ...customerIds.map((customerId) => ({
      ownerId: customerId,
      namespace: "custom",
      key: "customer_company_credit",
      type: "single_line_text_field",
      value: updatedCredit.toString(),
    })),
  ];

  // === 3. Mutation to update all metafields
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

  const updateResponse = await admin.graphql(mutation, {
    variables: { metafields },
  });

  console.log("response", updateResponse.body)

  const updateJson = await updateResponse.json();

  return json(updateJson);
};


export default function Index() {
  const { companies, orderData } = useLoaderData();



  console.log(orderData.data.orders.edges[0].node.createdAt)
  console.log(orderData.data.orders.edges[0].node.customer.id)
  console.log(orderData.data.orders.edges[0].node.currentTotalPriceSet.presentmentMoney.amount)

  return (
    <Page>
      <TitleBar title="Company Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Company Dashboardsa
                </Text>
                {companies.length === 0 ? (
                  <Text as="p" variant="bodyMd">
                    No companies found.
                  </Text>
                ) : (
                  companies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}


function CompanyCard({ company }) {
  const [credit, setCredit] = useState(company.credit);

  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  return (
    <Box
      key={company.id}
      padding="400"
      background="bg-surface"
      borderWidth="025"
      borderRadius="200"
      borderColor="border-subdued"
    >
      <BlockStack gap="200">
        <Text variant="headingSm">{company.name}</Text>
        <Text as="p" variant="bodyMd">
          <strong>Company Credit:</strong> ${company.credit}
        </Text>

        <fetcher.Form method="post">
          <input type="hidden" name="ownerId" value={company.id} />
          <TextField
            label="Update Credit"
            name="credit"
            type="text"
            autoComplete="off"
            value={credit}
            onChange={setCredit}
          />
          <Button submit loading={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Credit"}
          </Button>
        </fetcher.Form>
      </BlockStack>
    </Box>
  );
}
