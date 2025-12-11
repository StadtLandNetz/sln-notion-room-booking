import {
	type BookingItem,
	getNotionItemsByRoom,
	getCurrentBookingItems,
	getTodayFutureBookingItems,
	getRoomInfo,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({ params, url }) => {
	const roomParam: string = params.room;

	// Use filtered query - much faster!
	const filteredItems: BookingItem[] = await getNotionItemsByRoom(roomParam);

	const currentItems: BookingItem[] = getCurrentBookingItems(filteredItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(filteredItems);

	// Get room info - works even if there are no bookings
	const room: Room | undefined = getRoomInfo(roomParam);

	// Für TRMNL absolute URLs erstellen
	const baseUrl = url.origin;

	// Check for dark mode parameter
	const isDarkMode = url.searchParams.has('dark') || url.searchParams.has('darkmode');

	// QR Code server-seitig generieren
	const bookingUrl = `${baseUrl}/${roomParam}/booking`;
	let qrCodeDataURL = '';
	
	try {
		qrCodeDataURL = await QRCode.toDataURL(bookingUrl, {
			width: 150,
			margin: 2,
			color: {
				dark: isDarkMode ? '#FFFFFF' : '#000000',
				light: isDarkMode ? '#000000' : '#FFFFFF'
			}
		});
	} catch (error) {
		console.error('QR Code generation failed:', error);
	}

	return {
		room,
		roomParam,
		currentItems,
		futureItems,
		baseUrl,
		qrCodeDataURL,
		isDarkMode
	};
};