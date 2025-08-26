import {
	type BookingItem,
	getNotionItems,
	getCurrentBookingItems,
	extractUniqueRoomsFromBooking,
	getTodayFutureBookingItems,
	type Room
} from '$lib/notion';
import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({ params, url }) => {
	const roomParam: string = params.room;

	const notionItems: BookingItem[] = await getNotionItems();
	
	// Filtere Items nach Room-Name ODER Room-UUID
	const filteredItems = notionItems.filter(item => 
		item.room.toLowerCase() === roomParam.toLowerCase() ||
		item.roomUUID === roomParam
	);
	
	const currentItems: BookingItem[] = getCurrentBookingItems(filteredItems);
	const futureItems: BookingItem[] = getTodayFutureBookingItems(filteredItems);
	
	// Extrahiere nur den spezifischen Room (nach Name oder UUID)
	const allRooms: Room[] = extractUniqueRoomsFromBooking(notionItems);
	const room: Room | undefined = allRooms.find(r => 
		r.room.toLowerCase() === roomParam.toLowerCase() ||
		r.roomUUID === roomParam
	);

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