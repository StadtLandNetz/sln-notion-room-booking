import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
	extractUniqueRoomsFromBooking,
	getTodayFutureBookingItems,
	createBooking,
	type Room
} from '$lib/notion';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
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

// Hilfsfunktion: Prüft ob ein Zeitraum frei ist
function isTimeSlotAvailable(
	startTime: Date, 
	endTime: Date, 
	currentItems: BookingItem[], 
	futureItems: BookingItem[]
): boolean {
	const allItems = [...currentItems, ...futureItems];
	
	for (const item of allItems) {
		// Überschneidung prüfen: 
		// Neuer Termin startet vor Ende eines bestehenden Termins UND
		// Neuer Termin endet nach Start eines bestehenden Termins
		if (startTime < item.to && endTime > item.from) {
			return false; // Überschneidung gefunden
		}
	}
	
	return true; // Keine Überschneidung
}

export const actions: Actions = {
	book: async ({ request, params }) => {
		const data = await request.formData();
		const duration = data.get('duration') as string;
		const title = data.get('title') as string;
		const bookAfterCurrent = data.get('bookAfterCurrent') === 'true';
		
		if (!duration || !title) {
			return fail(400, { message: 'Duration and title are required' });
		}

		const roomParam: string = params.room;
		
		// Daten neu laden für aktuelle Verfügbarkeit
		const notionItems: BookingItem[] = await getNotionItems();
		const filteredItems = notionItems.filter(item => 
			item.room.toLowerCase() === roomParam.toLowerCase() ||
			item.roomUUID === roomParam
		);
		
		const currentItems: BookingItem[] = getCurrentBookingItems(filteredItems);
		const futureItems: BookingItem[] = getTodayFutureBookingItems(filteredItems);
		
		const allRooms: Room[] = extractUniqueRoomsFromBooking(notionItems);
		const room: Room | undefined = allRooms.find(r => 
			r.room.toLowerCase() === roomParam.toLowerCase() ||
			r.roomUUID === roomParam
		);

		if (!room) {
			return fail(404, { message: 'Room not found' });
		}

		// Berechne Start- und Endzeit
		let startTime: Date;
		const durationMinutes = parseInt(duration);
		
		if (bookAfterCurrent && currentItems.length > 0) {
			// Buchung nach aktuellem Meeting
			startTime = currentItems[0].to; // Beginnt wenn aktuelles Meeting endet
		} else {
			// Sofortige Buchung
			const now = new Date();
			startTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 Minuten Puffer
		}
		
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

		// Prüfe Verfügbarkeit
		if (bookAfterCurrent) {
			// Nur gegen zukünftige Meetings prüfen
			if (!isTimeSlotAvailable(startTime, endTime, [], futureItems)) {
				return fail(409, { 
					message: `Time slot after current meeting is not available for ${duration} minutes.`
				});
			}
		} else {
			// Normal prüfen
			if (!isTimeSlotAvailable(startTime, endTime, currentItems, futureItems)) {
				return fail(409, { 
					message: `Room is not available for ${duration} minutes. Please check the schedule.`
				});
			}
		}

		try {
			// Erstelle Buchung
			const bookingData: BookingItem = {
				room: room.room,
				roomUUID: room.roomUUID,
				from: startTime,
				to: endTime,
				user: ['Quick Booking'], // Default user
				title: title
			};

			await createBooking(bookingData);
			
		} catch (error) {
			console.error('Booking error:', error);
			return fail(500, { 
				message: 'Failed to create booking. Please try again.' 
			});
		}
		
		// Redirect zurück zur Raumseite (außerhalb try-catch)
		throw redirect(302, `/${roomParam}`);
	}
};