import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endMeeting } from '$lib/notion';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { pageId, startTime } = await request.json();

		if (!pageId || !startTime) {
			return json(
				{
					success: false,
					error: 'Page ID und Start-Zeit sind erforderlich.'
				},
				{ status: 400 }
			);
		}

		await endMeeting(pageId, new Date(startTime));

		return json({
			success: true,
			message: 'Meeting erfolgreich beendet.'
		});
	} catch (error: unknown) {
		console.error('Fehler beim Beenden des Meetings:', error);
		return json(
			{
				success: false,
				error: (error as Error).message
			},
			{ status: 500 }
		);
	}
};