import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!;

console.log('🚀 ~ NOTION_TOKEN:', NOTION_TOKEN);
console.log('🚀 ~ NOTION_DATABASE_ID:', NOTION_DATABASE_ID);

const notion = new Client({
	auth: NOTION_TOKEN
});

export type BookingItem = {
	room: string;
	roomUUID: string;
	from: Date;
	to: Date;
	user: string[];
	duration?: string;
	title?: string;
};
export type Room = {
	room: string;
	roomUUID: string;
};

export type NotionBookedItem = {
	bookingItem: BookingItem;
	response: unknown;
}

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
	pageObjectResults.sort((a, b) => {
		const fromA =
			a.properties.Slot.type === 'date' && a.properties.Slot.date
				? new Date(a.properties.Slot.date.start).getTime()
				: 0;
		const fromB =
			b.properties.Slot.type === 'date' && b.properties.Slot.date
				? new Date(b.properties.Slot.date.start).getTime()
				: 0;
		const toA =
			a.properties.Slot.type === 'date' && a.properties.Slot.date && a.properties.Slot.date.end
				? new Date(a.properties.Slot.date.end).getTime()
				: 0;
		const toB =
			b.properties.Slot.type === 'date' && b.properties.Slot.date && b.properties.Slot.date.end
				? new Date(b.properties.Slot.date.end).getTime()
				: 0;

		if (fromA === fromB) {
			return toA - toB;
		}
		return fromA - fromB;
	});
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
				const correctHoursBy = 0;
				const addHours = correctHoursBy * 60 * 60 * 1000; // zeit korrigieren zwischen notion und server
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
export function extractUniqueRoomsFromBooking(items: BookingItem[]): Room[] {
	const allRooms = items.map((item) => ({
		room: item.room,
		roomUUID: item.roomUUID
	}));

	// Rooms anhand der roomUUID eindeutiger machen
	const uniqueRooms = Array.from(new Set(allRooms.map((r) => r.roomUUID))).map(
		(uuid) => allRooms.find((r) => r.roomUUID === uuid)!
	);

	return uniqueRooms;
}

export function getCurrentBookingItems(items: BookingItem[]): BookingItem[] {
	const now = new Date();
	// In 15 Minuten
	const nowPlus15 = new Date(now.getTime() + 15 * 60 * 1000);

	return items
		.map((item) => {
			// Bestimme "Mitternacht des Folgetags" basierend auf dem Start-Datum
			const endOfStartDay = new Date(item.from);
			endOfStartDay.setDate(endOfStartDay.getDate() + 1); // +1 Tag
			endOfStartDay.setHours(0, 0, 0, 0); // auf 00:00 Uhr setzen

			// Wenn das End-Datum (item.to) über den Start-Tag hinausgeht,
			// kürzen wir es auf Mitternacht des Folgetages
			if (item.to >= endOfStartDay) {
				item.to = endOfStartDay;
			}

			return item;
		})
		.filter((item) => {
			// Neu: "jetzt" ODER innerhalb der nächsten 15 Minuten beginnt
			// => item.from <= nowPlus15
			// UND es ist noch nicht vorbei => now <= item.to
			return item.from <= nowPlus15 && now <= item.to;
		});
}

export function getTodayFutureBookingItems(items: BookingItem[]): BookingItem[] {
	const now = new Date();
	const nowPlus15 = new Date(now.getTime() + 15 * 60 * 1000);

	// Anfang und Ende des heutigen Tages (lokale Zeit)
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
	const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

	return items.filter((item) => {
		// item.from muss >= "jetzt" (Zukunft) sein
		// und im heutigen Tagesbereich liegen
		// und nicht in den nächsten 15 Minuten beginnen
		return (
			item.from >= now &&
			item.from >= startOfToday &&
			item.from <= endOfToday &&
			item.from > nowPlus15
		);
	});
}

export function filterBookingsByRoom(items: BookingItem[], roomUUID: string): BookingItem[] {
	return items.filter((item) => item.roomUUID === roomUUID);
}

export async function createBooking(data: BookingItem): Promise<NotionBookedItem> {
	const { room, roomUUID, from, to, title } = data;

	// Validierung der Eingabedaten
	if (!room || !roomUUID || !from || !to || !title) {
		throw new Error('Fehlende erforderliche Felder.');
	}

	const fromDate = new Date(from);
	const toDate = new Date(to);

	if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
		throw new Error('Ungültiges Datum/Zeit-Format.');
	}

	if (fromDate >= toDate) {
		throw new Error('"Von"-Zeit muss vor der "Bis"-Zeit liegen.');
	}


	// Erstelle einen neuen Page-Eintrag in der Notion-Datenbank
	const response = await notion.pages.create({
		parent: { database_id: NOTION_DATABASE_ID },
		properties: {
			Room: {
				select: {
					name: room
				}
			},
			Slot: {
				date: {
					start: fromDate.toISOString(),
					end: toDate.toISOString()
				}
			},
			Title: {
				title: [
					{
						text: {
							content: title
						}
					}
				]
			}
		}
	});
	const responseItem: NotionBookedItem = {
		bookingItem: data,
		response: response
	}

	return responseItem;
}
