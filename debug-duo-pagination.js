import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
	auth: NOTION_TOKEN
});

async function debugDuoPagination() {
	console.log('🔍 Fetching ALL Duo-Booth bookings with pagination...\n');

	let allResults = [];
	let hasMore = true;
	let startCursor = undefined;
	let pageNum = 0;

	while (hasMore) {
		pageNum++;
		console.log(`📄 Fetching page ${pageNum}...`);

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
					direction: 'ascending'
				}
			],
			page_size: 100,
			start_cursor: startCursor
		});

		console.log(`   Got ${response.results.length} results`);
		console.log(`   Has more: ${response.has_more}`);

		// Check each result for MVA or MB
		for (const page of response.results) {
			if (page.object !== 'page') continue;

			const personProp = page.properties.Person;
			const titleProp = page.properties.Title;
			const slotProp = page.properties.Slot;

			const persons = personProp?.type === 'people'
				? personProp.people.map(p => p.name)
				: [];

			const title = titleProp?.type === 'title' && titleProp.title.length > 0
				? titleProp.title.map(t => t.plain_text).join('')
				: 'No title';

			if (persons.includes('MVA') || persons.includes('MB')) {
				console.log(`\n   ⚠️  FOUND MVA/MB in page ${pageNum}:`);
				console.log(`      Title: ${title}`);
				console.log(`      Persons: ${persons.join(', ')}`);
				if (slotProp?.type === 'date' && slotProp.date) {
					console.log(`      Start: ${slotProp.date.start}`);
					console.log(`      End: ${slotProp.date.end}`);
				}
				console.log(`      Page ID: ${page.id}`);
			}
		}

		allResults = allResults.concat(response.results);
		hasMore = response.has_more;
		startCursor = response.next_cursor ?? undefined;
	}

	console.log(`\n✅ Total results across all pages: ${allResults.length}`);

	// Count MVA/MB
	const mvaMbCount = allResults.filter(page => {
		if (page.object !== 'page') return false;
		const personProp = page.properties.Person;
		const persons = personProp?.type === 'people'
			? personProp.people.map(p => p.name)
			: [];
		return persons.includes('MVA') || persons.includes('MB');
	}).length;

	console.log(`📊 Items with MVA or MB: ${mvaMbCount}`);
}

debugDuoPagination().catch(console.error);
