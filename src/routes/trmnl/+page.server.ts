import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
	extractUniqueRoomsFromBooking,
	getTodayFutureBookingItems,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const notionItems: BookingItem[] = await getNotionItems();
	
	const currentItems: BookingItem[] = getCurrentBookingItems(notionItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(notionItems);
	const rooms: Room[] = extractUniqueRoomsFromBooking(notionItems);
	
	// Für TRMNL absolute URLs erstellen
	const baseUrl = url.origin;

	return {
		rooms,
		currentItems,
		futureItems,
		baseUrl
	};
};