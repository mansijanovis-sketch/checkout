// index.js
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 80;
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Hello World from Express rew!');
});

app.post('/webhook/orders/create', (req, res) => {
    const orderData = req.body
    console.log("received data", orderData)
    // res.send('Hello World from Express!');
    res.status(200).send('webhook received')
})

app.post('/webhook/customer/update', (req, res) => {
    const orderData = req.body
    console.log("received customer", orderData)
    res.status(200).send('customer received')
})


app.post('/checkoutupdate', (req, res) => {
    const ab = req.body
    console.log("checkout my data", ab)
    res.status(200).send('customer received')

})

// Example Express route
app.post("/update-company-credit", async (req, res) => {
    const { companyId, remainingCredit } = req.body;

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

    try {
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

        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});