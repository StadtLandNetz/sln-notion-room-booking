import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
	extractUniqueRoomsFromBooking,
	getTodayFutureBookingItems,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ depends }) => {
	// Register dependency so invalidate('home:data') will trigger this load function
	depends('home:data');

	const notionItems: BookingItem[] = await getNotionItems();
	const currentItems: BookingItem[] = getCurrentBookingItems(notionItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(notionItems);

	const rooms: Room[] = await extractUniqueRoomsFromBooking(notionItems);

	return {
		rooms,
		currentItems,
		futureItems
	};
};


