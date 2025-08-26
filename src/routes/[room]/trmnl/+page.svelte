<script lang="ts">
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';
	import { formatMinutes, formatTimeUntil, formatRemainingTime } from '$lib/timeUtils';

	let { data }: { data: PageData } = $props();

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;
	const baseUrl = data.baseUrl;
	const qrCodeDataURL = data.qrCodeDataURL;
	const isDarkMode = data.isDarkMode;

	// Aktuelle Zeit für verbleibende Zeit-Berechnung
	const now = new Date();

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: 'Europe/Berlin'
		});
	}

	function calculateFreeTime(items: BookingItem[], currentNow: Date): number {
		if (items.length === 0) return -1; // Komplett frei
		const nextItem = items[0];
		const diff = nextItem.from.getTime() - currentNow.getTime();
		return Math.floor(diff / 60000); // Minuten bis zum nächsten Termin
	}

	function calculateDuration(from: Date, to: Date): string {
		const diff = to.getTime() - from.getTime();
		const minutes = Math.floor(diff / 60000);
		return formatMinutes(minutes);
	}

	function getDisplayTime(endDate: Date, currentTime: Date): string {
		const diffMinutes = (endDate.getTime() - currentTime.getTime()) / 60000;
		
		if (diffMinutes <= 30) {
			const endTimeString = endDate.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
				timeZone: 'Europe/Berlin'
			});
			return `until ${endTimeString}`;
		} else {
			return formatRemainingTime(endDate, currentTime) + " remain"; // Show remaining time
		}
	}

	// Color scheme based on dark mode
	const colors = isDarkMode ? {
		background: '#000000',
		text: '#ffffff',
		border: '#ffffff',
		headerBg: '#000000',
		headerText: '#ffffff',
		occupied: '#ffffff',
		occupiedText: '#000000',
		free: '#333333',
		freeText: '#ffffff',
		upcoming: '#333333',
		upcomingText: '#ffffff',
		listItemBg: '#333333',
		listItemText: '#ffffff',
		listBorder: '#ffffff',
		qrBorder: '#ffffff',
		freeAfterBg: '#333333'
	} : {
		background: '#ffffff',
		text: '#000000',
		border: '#000000',
		headerBg: '#ffffff',
		headerText: '#000000',
		occupied: '#000000',
		occupiedText: '#ffffff',
		free: '#666666',
		freeText: '#ffffff',
		upcoming: '#666666',
		upcomingText: '#ffffff',
		listItemBg: '#6b6b6b',
		listItemText: '#ffffff',
		listBorder: '#cccccc',
		qrBorder: '#cccccc',
		freeAfterBg: '#666666'
	};
</script>

<svelte:head>
	<title>SLN Office - {room?.room || roomParam} | TRMNL</title>
	<meta name="description" content="Bookings für {room?.room || roomParam}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div style="background-color: {colors.background}; color: {colors.text}; min-height: 100vh; padding: 0; margin: 0;">

<div
	style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid {colors.border}; padding: 0 10px; background-color: {colors.headerBg};"
>
	<div>
		<h1 style="font-size: 24px; font-weight: bold; color: {colors.headerText}; margin: 0;">
			SLN Office - {room?.room || roomParam}
		</h1>
		<p style="font-size: 14px; color: {colors.headerText}; margin: 0; opacity: 0.8;">
			{now.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
				timeZone: 'Europe/Berlin'
			})} Uhr
		</p>
	</div>
	<div style="display: flex; align-items: center; gap: 15px;">
		<img
			class="logo"
			style="text-align: right; width:50px;"
			src="{baseUrl}/logo.png"
			alt="SLN Logo"
		/>
	</div>
</div>

{#if !room}
	<div style="text-align: center; padding: 20px; border: 2px solid {colors.border}; background: {colors.background}; color: {colors.text};">
		<p>Raum "{roomParam}" nicht gefunden.</p>
	</div>
{:else if currentItems.length === 0 && futureItems.length === 0}
	<!-- Komplett frei - keine Termine -->
	<div style="background: {colors.background}; color: {colors.text}; padding: 40px; text-align: center;">
		<div style="font-size: 100px; font-weight: bold;">FREE</div>
	</div>
	<!-- QR Code rechts -->
	<div style="flex-shrink: 0; width: 150px; text-align: center; padding: 20px;float: right;">
		{#if qrCodeDataURL}
			<img
				src={qrCodeDataURL}
				alt="Booking QR Code"
				style="border: 2px solid {colors.qrBorder}; width: 120px; height: 120px;"
			/>
			<div style="font-size: 12px; color: {colors.text}; margin-top: 5px; font-weight: bold;">BOOK ROOM</div>
		{/if}
	</div>
{:else}
	<!-- Aktueller Termin läuft -->
	{#if currentItems.length > 0}
		{@const firstItem = currentItems[0]}
		<div
			style="background: {colors.occupied}; color: {colors.occupiedText}; padding: 20px; text-align: center;display: flex; align-items: center;"
		>
			<div style="width: 50%; float: left; text-align: left; font-size: 65px; ">OCCUPIED</div>
			<div
				style="width: 50%; float: left; text-align: left; border-left: 5px solid {colors.occupiedText};padding-left: 50px;margin-left: 50px;"
			>
				<div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">
					<span style="font-size: 55px;">{getDisplayTime(firstItem.to, now)}</span>
				</div>
				<div style="font-size: 18px; margin-bottom: 8px;">
					{formatTime(firstItem.from)} - {formatTime(firstItem.to)} Uhr |
					{firstItem.user.join(', ')}
					<br />
					{firstItem.title || 'Meeting'}
				</div>
			</div>
		</div>
		<!-- Kein aktueller Termin, aber zukünftige vorhanden -->
	{:else if futureItems.length > 0}
		{@const nextItem = futureItems[0]}
		{@const freeMinutes = calculateFreeTime(futureItems, now)}
		<div style="background: {colors.free}; color: {colors.freeText}; padding: 20px; display: flex;">
			<div
				style="font-size: 32px; font-weight: bold; margin-bottom: 10px; text-align: left; width: 30%; float: left;"
			>
				<span style="font-size: 70px;">FREE</span> <br />for {formatMinutes(freeMinutes)}
			</div>
			<div
				style="width: 70%;float: left; border-left: 5px solid {colors.freeText};padding-left: 50px;margin-left: 50px;"
			>
				<div style="font-size: 32px; margin-bottom: 8px; text-align: left; ">
					<span style="font-size: 24px;"><strong>Upcoming:</strong></span> <br />
					{formatTime(nextItem.from)} - {formatTime(nextItem.to)} Uhr
					<br />
					{nextItem.user.join(', ')}
					<br />{nextItem.title || 'Meeting'}
				</div>
			</div>
		</div>
	{/if}

	<!-- Container für Liste und QR Code -->
	<div style="display: flex; width: 100%; background-color: {colors.background};">
		<!-- Weitere Meetingen als Liste -->
		<div style="flex: 1; margin-right: 20px;">
			<!-- Weitere aktuelle Meetingen (falls vorhanden) -->
			{#each currentItems.slice(1) as item}
				<div style="background: {colors.listItemBg}; color: {colors.listItemText}; padding: 8px; margin-bottom: 4px;">
					📅 <strong>UPCOMING in {formatTimeUntil(item.from, now)}</strong> for {item.duration ||
						calculateDuration(item.from, item.to)}
					| {item.title || 'Meeting'}
					<div style="margin-left: 22px; font-size: 14px;">
						{formatTime(item.from)} Uhr - {formatTime(item.to)} Uhr | {item.user.join(', ')}
					</div>
				</div>
			{/each}

			<!-- Zukünftige Meetingen (ohne erste, falls sie im Hero angezeigt wird) -->
			{#each currentItems.length > 0 ? futureItems : futureItems.slice(1) as item}
				<div style="color: {colors.text}; padding: 8px 0; border-bottom: 2px solid {colors.listBorder};">
					<div style="font-size: 18px; margin-left: 10px;">
						📅 <strong>in {formatTimeUntil(item.from, now)}</strong> for {item.duration ||
							calculateDuration(item.from, item.to)}
						| {item.title || 'Meeting'}
					</div>
					<div style="margin-left: 33px; font-size: 14px;">
						{formatTime(item.from)} Uhr - {formatTime(item.to)} Uhr | {item.user.join(', ')}
					</div>
				</div>
			{/each}

			<!-- Info wenn aktueller Termin läuft aber keine weiteren Termine anstehen -->
			{#if currentItems.length > 0 && futureItems.length === 0}
				<div
					style="background: {colors.freeAfterBg}; color: {colors.freeText}; padding: 12px; margin-top: 10px; text-align: center; font-size: 18px; font-weight: bold;"
				>
					FREE after current meeting ends
				</div>
			{/if}
		</div>

		<!-- QR Code rechts -->
		<div style="flex-shrink: 0; width: 150px; text-align: center; padding: 20px;">
			{#if qrCodeDataURL}
				<img
					src={qrCodeDataURL}
					alt="Booking QR Code"
					style="border: 2px solid {colors.qrBorder}; width: 120px; height: 120px;"
				/>
				<div style="font-size: 12px; color: {colors.text}; margin-top: 5px; font-weight: bold;">
					BOOK ROOM
				</div>
			{/if}
		</div>
	</div>
{/if}

</div>