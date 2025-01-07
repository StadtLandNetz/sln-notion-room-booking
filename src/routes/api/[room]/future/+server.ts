import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getNotionItems, getTodayFutureBookingItems, filterBookingsByRoom, type BookingItem } from '$lib/notion';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const notionItems:BookingItem[] = await getNotionItems();
		const items:BookingItem[] = getTodayFutureBookingItems(notionItems);

		const roomUUID = params.room; // "[room]" in der URL
		const filteredItems = filterBookingsByRoom(items, roomUUID);

		return json({
			success: true,
			allItems: items,
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
