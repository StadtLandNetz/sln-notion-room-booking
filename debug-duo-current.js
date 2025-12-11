import { getNotionItemsByRoom, getCurrentBookingItems } from './src/lib/notion.ts';

async function debugDuoCurrent() {
	console.log('🔍 Fetching Duo-Booth current bookings via getNotionItemsByRoom...\n');

	const roomUUID = '2d67d893-535e-4e69-a335-ab48475ad58b';
	const allItems = await getNotionItemsByRoom(roomUUID);

	console.log(`Total items returned by getNotionItemsByRoom: ${allItems.length}\n`);

	allItems.forEach((item, idx) => {
		console.log(`[${idx}] ${item.title || 'No title'}`);
		console.log(`    User: ${item.user.join(', ')}`);
		console.log(`    From: ${item.from.toISOString()}`);
		console.log(`    To: ${item.to.toISOString()}`);
		console.log(`    Room: ${item.room}`);
		console.log('');
	});

	console.log('Filtering to current items only...\n');
	const currentItems = getCurrentBookingItems(allItems);

	console.log(`Current items: ${currentItems.length}\n`);

	currentItems.forEach((item, idx) => {
		console.log(`[${idx}] ${item.title || 'No title'}`);
		console.log(`    User: ${item.user.join(', ')}`);
		console.log(`    From: ${item.from.toISOString()}`);
		console.log(`    To: ${item.to.toISOString()}`);
		console.log('');
	});

	console.log('Current time:', new Date().toISOString());
}

debugDuoCurrent().catch(console.error);
