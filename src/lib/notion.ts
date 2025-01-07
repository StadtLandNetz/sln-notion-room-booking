// Beispiel-Datei, in der die Notion-Funktion ausgelagert ist
import { Client } from '@notionhq/client';
import { NOTION_TOKEN, NOTION_DATABASE_ID } from '$env/static/private';

const notion = new Client({
	auth: NOTION_TOKEN
});

export type BookingItem = {
	room: string;
	roomUUID: string;
	from: Date;
	to: Date;
	user: string[];
	duration: string;
};

// ROOMS
// - Propeller-Room:    b7474db4-c78b-4d37-b2af-9b2e8314a5bd
// - Duo-Booth:         2d67d893-535e-4e69-a335-ab48475ad58b
// - Single-Booth:      c6767b34-a9a2-4451-9103-821205b249c2
// - Meeting-Room:      070b77f9-8355-4166-922b-b3fc050097a6

export async function getNotionItems() {
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID
	});
	// Gib das komplette response-Objekt oder nur response.results zurück
	const pageObjectResults = response.results.filter(
		(result): result is PageObjectResponse => result.object === 'page'
	);
	return mapBookingItems(pageObjectResults);
}

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export function mapBookingItems(notionResults: PageObjectResponse[]): BookingItem[] {
	return (
		notionResults
			// Filtere ungültige oder leere Objekte heraus
			.filter((page) => page?.object === 'page')
			.map((page) => {
				const roomProperty =
					page.properties?.Room?.type === 'select' ? page.properties.Room.select : null;
				const slotProperty =
					page.properties?.Slot?.type === 'date' ? page.properties.Slot.date : null;
				const personProperty =
					page.properties?.Person?.type === 'people' ? page.properties.Person.people : [];
				const durationProperty =
					page.properties?.Duration?.type === 'formula' ? page.properties.Duration.formula : null;

				// Extrahiere die Werte:
				const room = roomProperty?.name ?? '';
				const roomUUID = roomProperty?.id ?? '';

				// Start-/Enddatum aus "Slot"
				const from = slotProperty?.start ? new Date(slotProperty.start) : new Date();
				const to = slotProperty?.end ? new Date(slotProperty.end) : new Date();

				// Person-Array (Namen) ermitteln
				const user = personProperty
					.map((person) => ('name' in person ? person.name : ''))
					// leere/ungültige Namen filtern
					.filter((name): name is string => !!name);

				// "Duration"-Property
				const duration =
					durationProperty?.type === 'string' && durationProperty.string
						? durationProperty.string
						: '';

				// RESULT
				const bookingItem: BookingItem = {
					room,
					roomUUID,
					from,
					to,
					user,
					duration
				};

				return bookingItem;
			})
	);
}

export function getCurrentBookingItems(items: BookingItem[]): BookingItem[] {
	const now = new Date();

	return items
		.map((item) => {
			// Prüfe, ob die Buchung länger als 24 Stunden dauert
			const diffMs = item.to.getTime() - item.from.getTime();
			const oneDayMs = 24 * 60 * 60 * 1000;

			if (diffMs > oneDayMs) {
				// Falls länger als 1 Tag, Ende auf "Mitternacht nach dem Starttag" setzen
				const endOfStartDay = new Date(item.from);
				// "24:00 Uhr des Anfangstags" = 00:00 Uhr des Folgetages
				endOfStartDay.setDate(endOfStartDay.getDate() + 1);
				endOfStartDay.setHours(0, 0, 0, 0);

				item.to = endOfStartDay;
			}

			return item;
		})
		.filter((item) => {
			// "Jetzt gültig" heißt: from <= now <= to
			return item.from <= now && now <= item.to;
		});
}

export function getTodayFutureBookingItems(items: BookingItem[]): BookingItem[] {
    const now = new Date();
  
    // Anfang und Ende des heutigen Tages (lokale Zeit)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
    return items.filter((item) => {
      // item.from muss >= "jetzt" (Zukunft) sein
      // und im heutigen Tagesbereich liegen
      return (
        item.from >= now &&
        item.from >= startOfToday &&
        item.from <= endOfToday
      );
    });
  }