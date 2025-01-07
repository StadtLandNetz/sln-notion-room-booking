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
                const addHours = 1 * 60 * 60 * 1000; // zeit korrigieren zwischen notion und server
                const from = slotProperty?.start
                ? new Date(new Date(slotProperty.start).getTime() + addHours)
                : new Date(Date.now() + addHours);

                const to = slotProperty?.end
                ? new Date(new Date(slotProperty.end).getTime() + addHours)
                : new Date(Date.now() + addHours);


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
			// Bestimme "Mitternacht des Folgetags" basierend auf dem Start-Datum
			const endOfStartDay = new Date(item.from);
			endOfStartDay.setDate(endOfStartDay.getDate() + 1); // +1 Tag
			endOfStartDay.setHours(0, 0, 0, 0);                  // auf 00:00 Uhr setzen

			// Prüfe, ob das End-Datum (item.to) bereits über den Start-Tag hinausgeht
			// (sprich, ob es am oder nach Mitternacht des Folgetags liegt).
			if (item.to >= endOfStartDay) {
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
  

export function filterBookingsByRoom(items: BookingItem[], roomUUID: string): BookingItem[] {
    return items.filter((item) => item.roomUUID === roomUUID);
  }