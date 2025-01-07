import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getNotionItems, getCurrentBookingItems } from '$lib/notion';

export const GET: RequestHandler = async () => {
	try {
		const notionItems = await getNotionItems();
		const items = getCurrentBookingItems(notionItems);

		return json({
			success: true,
			data: items
		});
	} catch (error: unknown) {
		console.error(error);
		return json(
			{
				success: false,
				error: (error as Error).message
			},
			{
				status: 500
			}
		);
	}
};
