import '@shopify/shopify-api/adapters/node';
import express from 'express';
import bodyParser from 'body-parser';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const app = express();

const SHOP = 'checkoutdemonewstore.myshopify.com';
const ADMIN_API_ACCESS_TOKEN = 'shpua_d3de5d6b67acccf1431e01cfbc651e98';
const API_KEY = 'f9b0c69c01d1eaab381e0e60b196c65c';
const API_SECRET_KEY = 'c06c588e189505a4c6e3ea01a1e5a394';



app.use(bodyParser.json());

const shopify = shopifyApi({
  apiKey: API_KEY,
  apiSecretKey: API_SECRET_KEY,
  scopes: ['write_customers', 'write_companies'],
  hostName: SHOP,
  apiVersion: LATEST_API_VERSION,
  isCustomStoreApp: true,
  adminApiAccessToken: ADMIN_API_ACCESS_TOKEN,
});

const adminClient = new shopify.clients.Graphql({
  session: { shop: SHOP, accessToken: ADMIN_API_ACCESS_TOKEN },
});

// Root test
app.get('/', (req, res) => {
  res.json({ message: 'Hello Mansi' });
});


// ✅ Checkout update route
app.post('/checkoutupdate', async (req, res) => {
  try {
    console.log('checkout my data', req.body);

    const remainCreditAttr = req.body.note_attributes?.find(
      attr => attr.name === 'remain_credit'
    );
    const remainingCredit = remainCreditAttr?.value || null;
    const customerEmail = req.body.customer?.email;

    if (!customerEmail) {
      return res.status(400).json({ error: 'No customer email found' });
    }

    // Get company ID
    const companyResult = await adminClient.query({
      data: {
        query: `
          query getCompanyByEmail($query: String!) {
            companies(first: 1, query: $query) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        `,
        variables: { query: `contact_email:${customerEmail}` },
      },
    });

    const companyNode = companyResult.body?.data?.companies?.edges[0]?.node;
    if (!companyNode) {
      throw new Error('No company found for this customer email');
    }

    const companyId = companyNode.id;

    // Update metafield
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

    const updateResponse = await adminClient.query({
      data: {
        query: mutation,
        variables: {
          metafields: [
            {
              ownerId: companyId,
              namespace: 'custom',
              key: 'company_credit',
              type: 'single_line_text_field',
              value: remainingCredit,
            },
          ],
        },
      },
    });

    // Get updated company info
    const companyResponse = await adminClient.query({
      data: {
        query: `
          query getCompanyName($id: ID!) {
            company(id: $id) {
              id
              name
              metafield(namespace: "custom", key: "company_credit") {
                value
              }
            }
          }
        `,
        variables: { id: companyId },
      },
    });

    const companyName = companyResponse.body?.data?.company?.name || 'Unknown';

    res.status(200).json({
      success: true,
      companyName,
      metafieldUpdate: updateResponse.body.data.metafieldsSet,
    });

  } catch (error) {
    console.error('Error in /checkoutupdate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
