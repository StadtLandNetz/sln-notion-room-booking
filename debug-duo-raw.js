import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
	auth: NOTION_TOKEN
});

async function debugDuoRaw() {
	console.log('🔍 Fetching RAW Duo-Booth bookings from Notion API...\n');

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

	console.log(`Found ${response.results.length} bookings\n`);

	for (const page of response.results) {
		if (page.object !== 'page') continue;

		const slotProp = page.properties.Slot;
		const personProp = page.properties.Person;
		const titleProp = page.properties.Title;

		const title = titleProp?.type === 'title' && titleProp.title.length > 0
			? titleProp.title.map(t => t.plain_text).join('')
			: 'No title';

		const persons = personProp?.type === 'people'
			? personProp.people.map(p => p.name).join(', ')
			: 'None';

		console.log(`📄 "${title}"`);
		console.log(`   Person: ${persons}`);
		console.log(`   Slot property:`);
		console.log(`     Type: ${slotProp?.type}`);
		if (slotProp?.type === 'date' && slotProp.date) {
			console.log(`     Start: ${slotProp.date.start}`);
			console.log(`     End: ${slotProp.date.end}`);
			console.log(`     Timezone: ${slotProp.date.time_zone || 'N/A'}`);
			if (slotProp.date.start === slotProp.date.end) {
				console.log(`     ⚠️  WARNING: Start and End are identical!`);
			}
		}
		console.log('');
	}
}

debugDuoRaw().catch(console.error);
