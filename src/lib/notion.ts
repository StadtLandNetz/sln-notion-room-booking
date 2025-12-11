import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Notion configuration loaded from environment variables

const notion = new Client({
	auth: NOTION_TOKEN
});

export type BookingItem = {
	id?: string; // Notion Page ID
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

// Cache for all items
let cache: { data: BookingItem[], timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds - longer to prevent cache miss during pagination

// Cache for individual rooms
const roomCache: Map<string, { data: BookingItem[], timestamp: number }> = new Map();

// Promise to prevent duplicate concurrent requests
let fetchPromise: Promise<BookingItem[]> | null = null;

/**
 * Invalidates all caches (global and room-specific)
 * Call this after creating, updating, or deleting bookings
 */
export function invalidateCache(roomNameOrUUID?: string) {
	if (roomNameOrUUID) {
		// Invalidate specific room cache
		const roomName = UUID_TO_ROOM_NAME[roomNameOrUUID] || roomNameOrUUID;
		roomCache.delete(roomNameOrUUID);
		roomCache.delete(roomName);
		console.log('✓ Invalidated cache for room:', roomName);
	} else {
		// Invalidate all caches
		cache = null;
		roomCache.clear();
		fetchPromise = null;
		console.log('✓ Invalidated all caches');
	}
}

export async function getNotionItems() {
	// Check cache first
	const now = Date.now();
	if (cache && (now - cache.timestamp) < CACHE_TTL) {
		console.log('✓ Using cached data (' + cache.data.length + ' items)');
		return cache.data;
	}

	// If already fetching, return the existing promise
	if (fetchPromise) {
		console.log('⏳ Waiting for existing fetch to complete...');
		return fetchPromise;
	}

	// Create the fetch promise
	fetchPromise = (async () => {
		try {
			let allResults: any[] = [];
			let hasMore = true;
			let startCursor: string | undefined = undefined;

			// Calculate date range: yesterday to tomorrow (to catch overnight bookings)
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(23, 59, 59, 999);

			// Fetch pages from Notion API with date filter for better performance
			while (hasMore) {
				const response = await notion.databases.query({
					database_id: NOTION_DATABASE_ID,
					filter: {
						and: [
							{
								property: 'Slot',
								date: {
									on_or_after: yesterday.toISOString()
								}
							},
							{
								property: 'Slot',
								date: {
									on_or_before: tomorrow.toISOString()
								}
							}
						]
					},
					sorts: [
						{
							property: 'Slot',
							direction: 'descending'
						}
					],
					page_size: 100,
					start_cursor: startCursor
				});

				allResults = allResults.concat(response.results);
				hasMore = response.has_more;
				startCursor = response.next_cursor ?? undefined;
			}

			// Log the total number of results fetched
			console.log('✓ Fetched', allResults.length, 'booking items from Notion');

			// Filter to PageObjectResponse only
			const pageObjectResults = allResults.filter(
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
			const mappedItems = mapBookingItems(pageObjectResults);

			// Update cache
			const fetchTime = Date.now();
			cache = { data: mappedItems, timestamp: fetchTime };

			return mappedItems;
		} finally {
			// Clear the fetch promise after completion
			fetchPromise = null;
		}
	})();

	return fetchPromise;
}

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// UUID to Room Name mapping - so we can use Notion's select filter efficiently
export const UUID_TO_ROOM_NAME: Record<string, string> = {
	'b7474db4-c78b-4d37-b2af-9b2e8314a5bd': '🚁 Propeller-Room',
	'2d67d893-535e-4e69-a335-ab48475ad58b': '👥 Duo-Booth',
	'c6767b34-a9a2-4451-9103-821205b249c2': '1️⃣ Single-Booth',
	'070b77f9-8355-4166-922b-b3fc050097a6': '🤝 Meeting-Room',
	'809b91ac-17f1-4262-860d-568b8f90a7e0': '2️⃣ Single-Booth',
	'3d70e8c7-5d6f-423b-a034-1e4eb312d5a2': '3️⃣ Single-Booth'
};

// Helper function to get room info by UUID or name
export function getRoomInfo(roomNameOrUUID: string): Room | undefined {
	const roomName = UUID_TO_ROOM_NAME[roomNameOrUUID] || roomNameOrUUID;

	// Try to find UUID from name
	const uuid = Object.entries(UUID_TO_ROOM_NAME).find(([uuid, name]) =>
		name === roomName || uuid === roomNameOrUUID
	)?.[0];

	if (uuid && UUID_TO_ROOM_NAME[uuid]) {
		return {
			roomUUID: uuid,
			room: UUID_TO_ROOM_NAME[uuid]
		};
	}

	// Fallback: create room object from the parameter
	return {
		roomUUID: roomNameOrUUID,
		room: roomName
	};
}

// Filtered query for a specific room - much faster than getting all items
export async function getNotionItemsByRoom(roomNameOrUUID: string): Promise<BookingItem[]> {
	// Check cache first
	const now = Date.now();
	const cached = roomCache.get(roomNameOrUUID);
	if (cached && (now - cached.timestamp) < CACHE_TTL) {
		console.log('✓ Using cached data for room:', roomNameOrUUID, '(' + cached.data.length + ' items)');
		return cached.data;
	}

	console.log('✓ Fetching items for room:', roomNameOrUUID);

	// Convert UUID to room name if needed (Notion select filter only works with names, not UUIDs)
	const roomName = UUID_TO_ROOM_NAME[roomNameOrUUID] || roomNameOrUUID;

	// Calculate date range: yesterday to tomorrow (same as main query)
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	yesterday.setHours(0, 0, 0, 0);

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(23, 59, 59, 999);

	// Query Notion with room filter with pagination support
	// Note: We only filter by room here, not by date, because Notion's date filter
	// only checks the start date, not the end date. We'll filter by date in JS instead.
	let allResults: any[] = [];
	let hasMore = true;
	let startCursor: string | undefined = undefined;

	while (hasMore) {
		const response = await notion.databases.query({
			database_id: NOTION_DATABASE_ID,
			filter: {
				property: 'Room',
				select: {
					equals: roomName
				}
			},
			sorts: [
				{
					property: 'Slot',
					direction: 'ascending'
				}
			],
			page_size: 100,
			start_cursor: startCursor
		});

		allResults = allResults.concat(response.results);
		hasMore = response.has_more;
		startCursor = response.next_cursor ?? undefined;
	}

	// Filter to PageObjectResponse only
	const pageObjectResults = allResults.filter(
		(result): result is PageObjectResponse => result.object === 'page'
	);

	const mappedItems = mapBookingItems(pageObjectResults);

	// Filter by date range in JavaScript (since Notion's date filter doesn't work well for end dates)
	const filteredItems = mappedItems.filter(item => {
		// Include items that overlap with our date range (yesterday to tomorrow)
		return item.to >= yesterday && item.from <= tomorrow;
	});

	// Cache the result with BOTH the original param and the room name
	roomCache.set(roomNameOrUUID, { data: filteredItems, timestamp: now });
	if (roomName !== roomNameOrUUID) {
		roomCache.set(roomName, { data: filteredItems, timestamp: now });
	}

	console.log('✓ Fetched', filteredItems.length, 'items for room:', roomName, '(via', roomNameOrUUID + ')');

	return filteredItems;
}

export function mapBookingItems(notionResults: PageObjectResponse[]): BookingItem[] {
	return (
		notionResults
			// Filtere ungültige oder leere Objekte heraus
			.filter((page) => page?.object === 'page')
			// Filtere Seiten ohne gültiges Slot-Property (ohne Start/End Datum)
			.filter((page) => {
				const slotProperty = page.properties?.Slot?.type === 'date' ? page.properties.Slot.date : null;
				return slotProperty && slotProperty.start && slotProperty.end;
			})
			.map((page) => {
				const roomProperty =
					page.properties?.Room?.type === 'select' ? page.properties.Room.select : null;
				const slotProperty =
					page.properties?.Slot?.type === 'date' ? page.properties.Slot.date : null;
				const personProperty =
					page.properties?.Person?.type === 'people' ? page.properties.Person.people : [];
				const durationProperty =
					page.properties?.Duration?.type === 'formula' ? page.properties.Duration.formula : null;
				const titleProperty =
					page.properties?.Title?.type === 'title' ? page.properties.Title.title : [];

				// Extrahiere die Werte:
				const room = roomProperty?.name ?? '';
				const roomUUID = roomProperty?.id ?? '';

				// Start-/Enddatum aus "Slot" - wir wissen jetzt dass diese existieren
				const correctHoursBy = 0;
				const addHours = correctHoursBy * 60 * 60 * 1000; // zeit korrigieren zwischen notion und server
				const from = new Date(new Date(slotProperty!.start!).getTime() + addHours);
				const to = new Date(new Date(slotProperty!.end!).getTime() + addHours);

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

				// "Title"-Property
				const title = titleProperty
					.map((text) => text.plain_text)
					.join('')
					.trim();

				// RESULT
				const bookingItem: BookingItem = {
					id: page.id,
					room,
					roomUUID,
					from,
					to,
					user,
					duration,
					title: title || undefined
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
	
	// 12 Stunden im Voraus anstatt nur bis Ende des Tages
	const next12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

	return items.filter((item) => {
		// item.from muss >= "jetzt" (Zukunft) sein
		// und innerhalb der nächsten 12 Stunden liegen
		// und nicht in den nächsten 15 Minuten beginnen
		return (
			item.from >= now &&
			item.from <= next12Hours &&
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

	// Invalidate cache after creating booking
	invalidateCache();
	console.log('✓ Booking created, cache invalidated');

	return responseItem;
}

export async function endMeeting(pageId: string, startTime: Date): Promise<void> {
	if (!pageId) {
		throw new Error('Page ID ist erforderlich.');
	}

	const now = new Date();
	
	// Prüfe ob das neue End-Datum nach dem Start-Datum liegt
	if (now <= startTime) {
		// Setze End-Datum auf 1 Minute nach Start-Datum
		const endTime = new Date(startTime.getTime() + 60 * 1000);
		await notion.pages.update({
			page_id: pageId,
			properties: {
				Slot: {
					date: {
						start: startTime.toISOString(),
						end: endTime.toISOString()
					}
				}
			}
		});
	} else {
		// Normal: setze End-Datum auf jetzt
		await notion.pages.update({
			page_id: pageId,
			properties: {
				Slot: {
					date: {
						start: startTime.toISOString(),
						end: now.toISOString()
					}
				}
			}
		});
	}

	// Invalidate cache after updating meeting
	invalidateCache();
	console.log('✓ Meeting ended, cache invalidated');
}
