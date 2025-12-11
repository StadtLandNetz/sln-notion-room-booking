import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getNotionItemsByRoom, getCurrentBookingItems, type BookingItem } from '$lib/notion';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const roomUUID = params.room; // "[room]" in der URL

		// Use filtered query - much faster!
		const notionItems: BookingItem[] = await getNotionItemsByRoom(roomUUID);
		const filteredItems: BookingItem[] = getCurrentBookingItems(notionItems);

		return json({
			success: true,
			filteredItems: filteredItems
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
