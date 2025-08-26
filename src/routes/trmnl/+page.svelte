<script lang="ts">
	import type { BookingItem, Room } from '$lib/notion';
	import type { PageData } from './$types';
	import { formatRemainingTime } from '$lib/timeUtils';

	let { data }: { data: PageData } = $props();

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const rooms: Room[] = data.rooms.sort((a, b) => a.room.localeCompare(b.room));
	const baseUrl = data.baseUrl;
	const isDarkMode = data.isDarkMode;

	// Map roomUUID -> { current: BookingItem[], future: BookingItem[] }
	const roomItemMap: Record<string, { current: BookingItem[]; future: BookingItem[] }> = {};

	rooms.forEach((room) => {
		roomItemMap[room.roomUUID] = {
			current: currentItems.filter((i) => i.roomUUID === room.roomUUID),
			future: futureItems.filter((i) => i.roomUUID === room.roomUUID)
		};
	});

	const now = new Date();

	const timeString = now.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Europe/Berlin'
	});

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		return formatRemainingTime(to, currentNow) + ' remaining';
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
			return formatRemainingTime(endDate, currentTime) + " remaining";
		}
	}

	// Color scheme based on dark mode
	const colors = isDarkMode ? {
		background: '#000000',
		text: '#ffffff',
		headerBg: '#333333',
		headerText: '#ffffff',
		roomHeaderBg: '#1a1a1a',
		roomHeaderText: '#ffffff',
		currentBookingBg: '#ffffff',
		currentBookingText: '#000000',
		futureBookingBg: '#000000',
		futureBookingText: '#ffffff',
		border: '#ffffff',
		whitespace: '#000000'
	} : {
		background: '#ffffff',
		text: '#000000',
		headerBg: '#e0e0e0',
		headerText: '#000000',
		roomHeaderBg: '#f0f0f0',
		roomHeaderText: '#000000',
		currentBookingBg: '#000000',
		currentBookingText: '#ffffff',
		futureBookingBg: '#ffffff',
		futureBookingText: '#000000',
		border: '#000000',
		whitespace: '#ffffff'
	};
</script>

<svelte:head>
	<title>SLN Office | TRMNL</title>
	<meta name="description" content="SLN Office Overview" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div style="margin: 0 auto; max-width: 100%; padding: 8px; background-color: {colors.background}; color: {colors.text}; font-family: 'Arial', sans-serif;">
	<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid {colors.border}; padding: 0 8px; margin-bottom: 12px;">
		<div>
			<h1 style="font-size: 18px; font-weight: bold; color: {colors.text}; margin: 0;">SLN Office</h1>
			<p style="font-size: 12px; color: {colors.text}; margin: 0; font-weight: bold;">{timeString} Uhr</p>
		</div>
		<img
			style="width: 35px;"
			src="{baseUrl}/logo.png"
			alt="SLN Logo"
		/>
	</div>

	<table style="width: 100%; max-width: 100%; margin: 0 auto; border-collapse: collapse;">
		<thead>
			<tr>
				<th style="padding: 4px 6px; width: 25%; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">User</th>
				<th style="padding: 4px 6px; width: 25%; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Von</th>
				<th style="padding: 4px 6px; width: 25%; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Bis</th>
				<th style="padding: 4px 6px; width: 25%; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Dauer</th>
			</tr>
		</thead>
		<tbody>
			{#each rooms as room, index}
				{#if room.roomUUID !== ''}
					<!-- Raumüberschrift -->
					<!-- Whitespace row before room header (except first room) -->
					{#if index > 0}
						<tr>
							<td colspan="4" style="padding: 8px; background-color: {colors.whitespace};"> </td>
						</tr>
					{/if}
					<tr style="border-top: 2px solid {colors.border};">
						<td colspan="4" style="position: relative; padding: 2px 4px; background-color: {colors.roomHeaderBg}; color: {colors.roomHeaderText};">
							<h2 style="font-size: 11px; float: left; font-weight: bold; margin: 0;">
								<a href="/{room.roomUUID}" style="color: {colors.roomHeaderText}; text-decoration: none; cursor: pointer;">
									{room.room}
								</a>
							</h2>
							<code style="font-size: 8px; float: right; margin-top: 1px; color: {colors.roomHeaderText}; font-weight: bold;">
								{room.roomUUID}
							</code>
						</td>
					</tr>

					<!-- Keine Items? -->
					{#if roomItemMap[room.roomUUID].current.length === 0 && roomItemMap[room.roomUUID].future.length === 0}
						<tr>
							<td colspan="4" style="text-align: center; padding: 6px; background-color: {colors.futureBookingBg}; color: {colors.futureBookingText}; font-size: 13px; font-weight: bold;">no bookings today anymore</td>
						</tr>
					{/if}

					<!-- Aktuelle Buchungen -->
					{#each roomItemMap[room.roomUUID].current as item}
						<tr style="background-color: {colors.currentBookingBg}; color: {colors.currentBookingText};">
							<td style="padding: 6px 8px; font-size: 14px; font-weight: bold;">
								<span>{item.user.join(', ')}</span>
							</td>
							<td style="padding: 6px 8px; font-size: 14px; font-weight: bold;">
								{item.from.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' })} Uhr
							</td>
							<td style="padding: 6px 8px; font-size: 14px; font-weight: bold;">
								{item.to.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' })} Uhr
							</td>
							<td style="padding: 6px 8px; font-size: 14px; font-weight: bold;">{getDisplayTime(item.to, now)}</td>
						</tr>
					{/each}

					<!-- Zukünftige Buchungen -->
					{#each roomItemMap[room.roomUUID].future as item}
						<tr style="background-color: {colors.futureBookingBg}; color: {colors.futureBookingText};">
							<td style="padding: 6px 8px; font-size: 14px;">
								<span>{item.user.join(', ')}</span>
							</td>
							<td style="padding: 6px 8px; font-size: 14px;">
								{item.from.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' })} Uhr
							</td>
							<td style="padding: 6px 8px; font-size: 14px;">
								{item.to.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' })} Uhr
							</td>
							<td style="padding: 6px 8px; font-size: 14px;">{item.duration}</td>
						</tr>
					{/each}
				{/if}
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th style="padding: 4px 6px; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">User</th>
				<th style="padding: 4px 6px; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Von</th>
				<th style="padding: 4px 6px; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Bis</th>
				<th style="padding: 4px 6px; background-color: {colors.headerBg}; color: {colors.headerText}; text-align: left; font-size: 12px; font-weight: bold;">Dauer</th>
			</tr>
		</tfoot>
	</table>
</div>