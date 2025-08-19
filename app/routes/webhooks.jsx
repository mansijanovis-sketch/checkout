import { authenticate } from '../shopify.server';
import db from '../db.server';

export const action = async ({ request }) => {
    console.log(request)
    const {
        topic, shop, session, admin, payload
    } = await authenticate.webhook(request);
    // const { topic, shop, payload } = await authenticate.webhook(request);


    switch (topic) {
    
        case "CHECKOUTS_UPDATE":
            console.log("checkout updated");
            break;

        default:
            throw new Response('Unhandled webhook topic', { status: 404 });
    }

    throw new Response();
};
