// src/routes/api/notion/create/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { createBooking, type NotionBookedItem,type BookingItem } from '$lib/notion';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse das JSON vom Request-Body
        const data: BookingItem = await request.json();

        // Erstelle die Buchung in Notion
        const notionResponse: NotionBookedItem = await createBooking(data);

        // Rückgabe der erfolgreichen Antwort
        return new Response(JSON.stringify({ success: true, data: notionResponse }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: unknown) {
        console.error('Fehler beim Erstellen eines Notion-Eintrags:', error);

        // Fehlerbehandlung für spezifische Fehler
        return new Response(JSON.stringify({ success: false, error: (error as Error).message || 'Ein unerwarteter Fehler ist aufgetreten.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
