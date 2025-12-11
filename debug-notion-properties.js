import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
	auth: NOTION_TOKEN
});

async function debugProperties() {
	console.log('🔍 Fetching database schema...\n');

	// Get database schema
	const database = await notion.databases.retrieve({
		database_id: NOTION_DATABASE_ID
	});

	console.log('Database properties:');
	for (const [key, value] of Object.entries(database.properties)) {
		console.log(`  - ${key}: ${value.type}`);
	}

	console.log('\n🔍 Fetching recent items to check actual data...\n');

	// Get recent items
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID,
		sorts: [
			{
				property: 'Slot',
				direction: 'descending'
			}
		],
		page_size: 5
	});

	console.log(`Found ${response.results.length} recent items:\n`);

	for (const page of response.results) {
		if (page.object !== 'page') continue;

		const titleProp = page.properties.Title;
		const title = titleProp?.type === 'title' ? titleProp.title.map(t => t.plain_text).join('') : 'N/A';

		const personProp = page.properties.Person;
		const roomProp = page.properties.Room;
		const room = roomProp?.type === 'select' ? roomProp.select?.name : 'N/A';

		console.log(`📄 ${title} (${room})`);
		console.log(`   Person property type: ${personProp?.type}`);

		if (personProp?.type === 'people') {
			console.log(`   Person array length: ${personProp.people.length}`);
			personProp.people.forEach(person => {
				console.log(`     - Name: ${person.name}`);
				console.log(`       ID: ${person.id}`);
				if (person.person?.email) {
					console.log(`       Email: ${person.person.email}`);
				}
			});
		}

		// Check for created_by
		console.log(`   Created by: ${page.created_by.object}`);
		if (page.created_by.object === 'user') {
			console.log(`     ID: ${page.created_by.id}`);
		}

		// Check for last_edited_by
		console.log(`   Last edited by: ${page.last_edited_by.object}`);
		if (page.last_edited_by.object === 'user') {
			console.log(`     ID: ${page.last_edited_by.id}`);
		}

		console.log('');
	}
}

debugProperties().catch(console.error);
