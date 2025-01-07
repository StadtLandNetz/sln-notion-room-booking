import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
  extractUniqueRoomsFromBooking,
  getTodayFutureBookingItems,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
// export const load: PageServerLoad = async ({ params }) => {
	// const lang: string = params.room;

	const notionItems: BookingItem[] = await getNotionItems();
	const currentItems: BookingItem[] = getCurrentBookingItems(notionItems);
  const futureItems: BookingItem[] = getTodayFutureBookingItems(notionItems);
  
	const rooms: Room[] = await extractUniqueRoomsFromBooking(notionItems);

	return {
		props: {
			rooms,
			currentItems,
			futureItems
		}
	};
};
