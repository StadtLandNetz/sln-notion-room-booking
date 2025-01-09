import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
  extractUniqueRoomsFromBooking,
  getTodayFutureBookingItems,
	type Room,
	createBooking,
	type NotionBookedItem
} from '$lib/notion';
import type { Actions, PageServerLoad } from './$types';

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


export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const formData = await request.formData();

            const bookingItem: BookingItem = {
                room: formData.get('room')?.toString() || '',
                roomUUID: formData.get('roomUUID')?.toString() || '',
                from: new Date(formData.get('from')?.toString() || ''),
                to: new Date(formData.get('to')?.toString() || ''),
                title: formData.get('title')?.toString()
            };

            // Erstelle die Buchung in Notion
            const notionResponse: NotionBookedItem = await createBooking(bookingItem);

            // Rückgabe der erfolgreichen Antwort
            return {
                success: true,
                data: notionResponse
            };
        } catch (error: unknown) {
            console.error('Fehler beim Erstellen eines Notion-Eintrags:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.'
            };
        }
    }
};
