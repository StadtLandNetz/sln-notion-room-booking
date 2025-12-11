import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
	auth: NOTION_TOKEN
});

async function deleteInvalidBookings() {
	console.log('🔍 Searching for invalid bookings (where from = to)...\n');

	// Query all Duo-Booth bookings
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID,
		filter: {
			property: 'Room',
			select: {
				equals: '👥 Duo-Booth'
			}
		}
	});

	console.log(`Found ${response.results.length} total Duo-Booth bookings\n`);

	const invalidBookings = [];

	for (const page of response.results) {
		if (page.object !== 'page') continue;

		const slotProp = page.properties.Slot;
		const personProp = page.properties.Person;
		const titleProp = page.properties.Title;

		if (slotProp?.type === 'date' && slotProp.date) {
			const start = slotProp.date.start;
			const end = slotProp.date.end;

			// Check if start and end are the same (invalid booking)
			if (start === end) {
				const person = personProp?.type === 'people' && personProp.people.length > 0
					? personProp.people[0].name
					: 'Unknown';
				const title = titleProp?.type === 'title' && titleProp.title.length > 0
					? titleProp.title.map(t => t.plain_text).join('')
					: 'No title';

				invalidBookings.push({
					id: page.id,
					person,
					title,
					time: start
				});

				console.log(`❌ Found invalid booking:`);
				console.log(`   ID: ${page.id}`);
				console.log(`   Person: ${person}`);
				console.log(`   Title: ${title}`);
				console.log(`   Time: ${start} (start = end)`);
				console.log('');
			}
		}
	}

	if (invalidBookings.length === 0) {
		console.log('✅ No invalid bookings found!');
		return;
	}

	console.log(`\n📊 Found ${invalidBookings.length} invalid booking(s)\n`);
	console.log('⚠️  These bookings will be DELETED. Press Ctrl+C to cancel or wait 5 seconds to continue...\n');

	await new Promise(resolve => setTimeout(resolve, 5000));

	console.log('🗑️  Deleting invalid bookings...\n');

	for (const booking of invalidBookings) {
		try {
			await notion.pages.update({
				page_id: booking.id,
				archived: true
			});
			console.log(`✅ Deleted: ${booking.person} - ${booking.title}`);
		} catch (error) {
			console.error(`❌ Failed to delete ${booking.id}:`, error.message);
		}
	}

	console.log('\n✅ Done! Invalid bookings have been deleted.');
	console.log('💡 Tip: Refresh your browser to see the updated data.');
}

deleteInvalidBookings().catch(console.error);
