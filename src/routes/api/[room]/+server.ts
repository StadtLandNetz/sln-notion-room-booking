import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getNotionItemsByRoom, type BookingItem } from '$lib/notion';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const roomUUID = params.room; // "[room]" in der URL

		// Use filtered query - much faster!
		const filteredItems: BookingItem[] = await getNotionItemsByRoom(roomUUID);

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
