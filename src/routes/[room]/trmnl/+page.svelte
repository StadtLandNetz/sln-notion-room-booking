<script lang="ts">
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;
	const baseUrl = data.baseUrl;

	// Aktuelle Zeit für verbleibende Zeit-Berechnung
	const now = new Date();

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		const diff = to.getTime() - currentNow.getTime();
		const minutes = Math.floor(diff / 60000);
		return `${minutes} `;
	}

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
		if (minutes < 60) {
			return `${minutes} min`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
		}
	}

	function calculateMinutesUntil(from: Date, currentNow: Date): number {
		const diff = from.getTime() - currentNow.getTime();
		return Math.floor(diff / 60000);
	}
</script>

<svelte:head>
	<title>SLN Office - {room?.room || roomParam} | TRMNL</title>
	<meta name="description" content="Bookings für {room?.room || roomParam}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div
	style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CCC; padding: 0 10px;"
>
	<div>
		<h1 style="font-size: 24px; font-weight: bold; color: #000; margin: 0;">
			SLN Office - {room?.room || roomParam}
		</h1>
		<p style="font-size: 14px; color: #666; margin: 0;">
			{now.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
				timeZone: 'Europe/Berlin'
			})} Uhr
		</p>
	</div>
	<div
		style="font-size: 18px; font-weight: bold; color: #000; padding: 4px 8px; text-align: center;"
	>
		<img
			class="logo"
			style="text-align: right; width:50px;"
			src="{baseUrl}/logo.png"
			alt="SLN Logo"
		/>
	</div>
</div>

{#if !room}
	<div style="text-align: center; padding: 20px; border: 2px solid #000; background: #f0f0f0;">
		<p>Raum "{roomParam}" nicht gefunden.</p>
	</div>
{:else if currentItems.length === 0 && futureItems.length === 0}
	<!-- Komplett frei - keine Termine -->
	<div style="background: #666; color: #fff; padding: 40px; ; text-align: center;">
		<div style="font-size: 100px; font-weight: bold;">FREE</div>
	</div>
{:else}
	<!-- Aktueller Termin läuft -->
	{#if currentItems.length > 0}
		{@const firstItem = currentItems[0]}
		<div
			style="background: #000; color: #fff; padding: 20px;  text-align: center;display: flex; align-items: center;"
		>
			<div style="width: 50%; float: left; text-align: left; font-size: 65px; ">OCCUPIED</div>
			<div
				style="width: 50%; float: left; text-align: left; border-left: 1px solid #fff; padding-left: 50px;"
			>
				<div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">
					<span style="font-size: 55px;">{calculateRemainingTime(firstItem.to, now)}min</span> remain
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
		<div style="background: #666; color: #fff; padding: 20px;  display: flex;">
			<div
				style="font-size: 32px; font-weight: bold; margin-bottom: 10px;  text-align: left; width: 30%; float: left;"
			>
				<span style="font-size: 70px;">FREE</span> <br />for {freeMinutes} mins
			</div>
			<div style="width: 70%;float: left; border-left: 1px solid #fff; padding-left: 50px;">
				<div style="font-size: 24px; margin-bottom: 8px; text-align: left; ">
					<span style="font-size: 16px;"><strong>Upcoming:</strong></span> <br />
					{formatTime(nextItem.from)} - {formatTime(nextItem.to)} Uhr | {nextItem.user.join(', ')}
					<br />
					{nextItem.title || 'Meeting'}
				</div>
			</div>
		</div>
	{/if}

	<!-- Weitere Meetingen als Liste -->
	<div style="">
		<!-- Weitere aktuelle Meetingen (falls vorhanden) -->
		{#each currentItems.slice(1) as item}
			<div style="background: #000; color: #fff; padding: 8px; margin-bottom: 4px;">
				<div style="font-weight: bold; font-size: 14px;">■ AKTIV: {item.user.join(', ')}</div>
				<div>VON {formatTime(item.from)} Uhr BIS {formatTime(item.to)} Uhr</div>
				<div>NOCH {calculateRemainingTime(item.to, now)}</div>
			</div>
		{/each}

		<!-- Zukünftige Meetingen (ohne erste, falls sie im Hero angezeigt wird) -->
		{#each currentItems.length > 0 ? futureItems : futureItems.slice(1) as item}
			<div style="color: #333; padding: 8px 0; border-bottom: 2px solid #ccc;">
				<div style="font-size: 18px; margin-left: 10px;">
					📅 <strong>in {calculateMinutesUntil(item.from, now)} min</strong> for {item.duration ||
						calculateDuration(item.from, item.to)}
					| {item.title || 'Meeting'}
				</div>
				<div style="margin-left: 33px; font-size: 14px;">
					{formatTime(item.from)} Uhr - {formatTime(item.to)} Uhr | {item.user.join(', ')}
					<br />
				</div>
			</div>
		{/each}
		
		<!-- Info wenn aktueller Termin läuft aber keine weiteren Termine anstehen -->
		{#if currentItems.length > 0 && futureItems.length === 0}
			<div style="background: #666; color: #fff; padding: 12px; margin-top: 10px; text-align: center; font-size: 18px; font-weight: bold;">
				FREE after current meeting ends
			</div>
		{/if}
	</div>
{/if}
