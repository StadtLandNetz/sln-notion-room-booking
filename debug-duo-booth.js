import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
	auth: NOTION_TOKEN
});

async function debugDuoBooth() {
	console.log('🔍 Fetching Duo-Booth bookings...\n');

	// Query for Duo-Booth
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID,
		filter: {
			property: 'Room',
			select: {
				equals: '👥 Duo-Booth'
			}
		},
		sorts: [
			{
				property: 'Slot',
				direction: 'descending'
			}
		],
		page_size: 10
	});

	console.log(`Found ${response.results.length} bookings for Duo-Booth:\n`);

	for (const page of response.results) {
		if (page.object !== 'page') continue;

		const titleProp = page.properties.Title;
		const title = titleProp?.type === 'title' ? titleProp.title.map(t => t.plain_text).join('') : 'N/A';

		const slotProp = page.properties.Slot;
		const slot = slotProp?.type === 'date' && slotProp.date ?
			`${slotProp.date.start} → ${slotProp.date.end}` : 'N/A';

		const personProp = page.properties.Person;

		console.log(`📄 "${title}"`);
		console.log(`   Slot: ${slot}`);
		console.log(`   Person property type: ${personProp?.type}`);

		if (personProp?.type === 'people') {
			console.log(`   Person array length: ${personProp.people.length}`);
			if (personProp.people.length === 0) {
				console.log(`     ⚠️  EMPTY - No persons assigned!`);
			} else {
				personProp.people.forEach((person, idx) => {
					console.log(`     [${idx}] Name: "${person.name}"`);
					console.log(`         ID: ${person.id}`);
					console.log(`         Object: ${person.object}`);
				});
			}
		}

		console.log(`   Created by ID: ${page.created_by.id}`);
		console.log(`   Last edited by ID: ${page.last_edited_by.id}`);
		console.log('');
	}

	// Now let's check current time
	const now = new Date();
	console.log('\n⏰ Current time:', now.toISOString());
	console.log('   Looking for bookings around:', now.toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}));
}

debugDuoBooth().catch(console.error);
