import { getNotionItems, extractUniqueRoomsFromBooking } from './src/lib/notion.ts';

async function debugRooms() {
	console.log('Fetching all items from Notion...');
	const items = await getNotionItems();
	console.log(`Found ${items.length} total items`);

	const rooms = extractUniqueRoomsFromBooking(items);
	console.log('\nUnique rooms found:');
	rooms.forEach(room => {
		console.log(`  - ${room.room} (UUID: ${room.roomUUID})`);
	});

	// Create mapping
	console.log('\nMapping for notion.ts:');
	console.log('const UUID_TO_ROOM_NAME: Record<string, string> = {');
	rooms.forEach(room => {
		console.log(`	'${room.roomUUID}': '${room.room}',`);
	});
	console.log('};');
}

debugRooms().catch(console.error);
