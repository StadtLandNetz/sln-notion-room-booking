import {
	type BookingItem,
	getNotionItemsByRoom,
	getCurrentBookingItems,
	getTodayFutureBookingItems,
	getRoomInfo,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, depends }) => {
	// Register dependency so invalidate('room:data') will trigger this load function
	depends('room:data');

	const roomParam: string = params.room;

	// Use filtered query instead of getting all items - much faster!
	const filteredItems: BookingItem[] = await getNotionItemsByRoom(roomParam);

	const currentItems: BookingItem[] = getCurrentBookingItems(filteredItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(filteredItems);

	// Get room info - works even if there are no bookings
	const room: Room | undefined = getRoomInfo(roomParam);

	return {
		room,
		roomParam,
		currentItems,
		futureItems
	};
};