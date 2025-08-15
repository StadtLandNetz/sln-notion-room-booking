import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
	extractUniqueRoomsFromBooking,
	getTodayFutureBookingItems,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const roomParam: string = params.room;

	const notionItems: BookingItem[] = await getNotionItems();
	
	// Filtere Items nach Room-Name ODER Room-UUID
	const filteredItems = notionItems.filter(item => 
		item.room.toLowerCase() === roomParam.toLowerCase() ||
		item.roomUUID === roomParam
	);
	
	const currentItems: BookingItem[] = getCurrentBookingItems(filteredItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(filteredItems);
	
	// Extrahiere nur den spezifischen Room (nach Name oder UUID)
	const allRooms: Room[] = extractUniqueRoomsFromBooking(notionItems);
	const room: Room | undefined = allRooms.find(r => 
		r.room.toLowerCase() === roomParam.toLowerCase() ||
		r.roomUUID === roomParam
	);

	return {
		room,
		roomParam,
		currentItems,
		futureItems
	};
};