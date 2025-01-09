<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BookingItem, Room } from '$lib/notion';
	import type { PageData } from './$types';

	export let data: PageData;

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.props.currentItems;
	const futureItems: BookingItem[] = data.props.futureItems;
	const rooms: Room[] = data.props.rooms;

	// Map roomUUID -> { current: BookingItem[], future: BookingItem[] }
	const roomItemMap: Record<string, { current: BookingItem[]; future: BookingItem[] }> = {};

	rooms.forEach((room) => {
		roomItemMap[room.roomUUID] = {
			current: currentItems.filter((i) => i.roomUUID === room.roomUUID),
			future: futureItems.filter((i) => i.roomUUID === room.roomUUID)
		};
	});

	let now = new Date();

	let timeString = now.toLocaleTimeString('de', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		const diff = to.getTime() - currentNow.getTime();
		const minutes = Math.floor(diff / 60000);
		return `${minutes} min remaining`;
	}

	let counter = 0;

	onMount(() => {
		console.log('reload page');
		// refresh time every second
		const intervalClock = setInterval(() => {
			now = new Date();
			timeString = now.toLocaleTimeString('de', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		}, 1000);

		// refresh page every 10 seconds to reload data
		const intervalReload = setInterval(() => {
			counter++;
			console.log('🚀 ~ intervalReload ~ counter:', counter);
			location.reload();
		}, 6000);

		// Aufräumen bei Komponentenausblendung
		return () => {
			clearInterval(intervalClock);
			clearInterval(intervalReload);
		};
	});

	// Funktion zum Aufrufen der Action
	async function submitBooking(roomUUID: string) {
		try {
			// Erstelle ein neues FormData-Objekt
			const formData = new FormData();

			// Füge zusätzliche erforderliche Felder hinzu
			formData.append('roomUUID', roomUUID);
			formData.append('room', 'Duo-Booth'); // Beispiel: Name des Raums
			formData.append('from', new Date().toISOString()); // Startzeitpunkt (jetzt)
			formData.append('to', new Date(Date.now() + 3600000).toISOString()); // Endzeitpunkt (in 1 Stunde)
			formData.append('title', 'Team Meeting');

			// Sende die Daten an die aktuelle Seite (Action)
			const response = await fetch('', {
				// Leerer String bedeutet die aktuelle URL
				method: 'POST',
				body: formData
			});

			// Verarbeite die JSON-Antwort
			const result = await response.json();

			if (result.success) {
				// Aktualisiere die Seite oder Daten
				await invalidate(''); // Lädt die Daten neu, falls du `invalidate` verwendest

				console.log('Buchung erfolgreich erstellt:', result.data);
				alert('Buchung erfolgreich erstellt!');
			} else {
				// Fehlerbehandlung
				console.error('Fehler beim Erstellen der Buchung:', result.error);
				alert(`Fehler: ${result.error}`);
			}
		} catch (error) {
			console.error('Ein unerwarteter Fehler ist aufgetreten:', error);
			alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
		}
	}
</script>

<div class="container">
	<img class="logo" src="/logo.png" alt="" />
	<h1>SLN Office</h1>
	<p>{timeString} Uhr</p>

	<table>
		<thead>
			<tr>
				<th>User</th>
				<th>Von</th>
				<th>Bis</th>
				<th>Dauer</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td colspan="4" style="" class="devider"> </td>
			</tr>
			{#each rooms as room}
				{#if room.roomUUID !== ''}
					<!-- Raumüberschrift -->
					<tr>
						<td colspan="4">
							<h2>{room.room}</h2>
							<code>{room.roomUUID}</code>
							<button on:click={() => submitBooking(room.roomUUID)}> Buchung erstellen </button>
						</td>
					</tr>

					<!-- Keine Items? -->
					{#if roomItemMap[room.roomUUID].current.length === 0 && roomItemMap[room.roomUUID].future.length === 0}
						<tr>
							<td colspan="4" class="room">no bookings today anymore</td>
						</tr>
					{/if}

					<!-- Aktuelle Buchungen -->
					{#each roomItemMap[room.roomUUID].current as item}
						<tr class="current">
							<td>🟢 {item.user.join(', ')}</td>
							<td>
								{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>
								{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>{calculateRemainingTime(item.to, now)}</td>
						</tr>
					{/each}

					<!-- Zukünftige Buchungen -->
					{#each roomItemMap[room.roomUUID].future as item}
						<tr class="future">
							<td>⚪️ {item.user.join(', ')}</td>
							<td>
								{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>
								{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>{item.duration}</td>
						</tr>
					{/each}
					<tr>
						<td colspan="4" style="" class="devider"> </td>
					</tr>
				{/if}
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th>User</th>
				<th>Von</th>
				<th>Bis</th>
				<th>Dauer</th>
			</tr>
		</tfoot>
	</table>
</div>

<style>
	.container {
		margin: 0 auto;
		max-width: 800px;
		padding: 25px;
	}
	h1 {
		font-size: 32px;
	}
	h2 {
		font-size: 24px;
		float: left;
		font-weight: bold;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	td,
	th {
		padding: 0.5em;
		border: 1px solid #ccc;
		width: 25%;
	}
	th {
		background-color: #f0f0f0;
		text-align: left;
	}
	tr.current {
		background-color: #ebf3ea;
		color: #1f9012;
		/* font-weight: bold; */
		border: 2px solid #abdaa6;
	}
	tr.future {
		color: #5a5a5a;
	}
	code {
		font-size: 12px;
		float: right;
		margin-top: 10px;
	}
	.devider,
	.room {
		text-align: center;
		opacity: 0.6;
	}
	.devider {
		font-size: 10px;
		border-left: transparent;
		border-right: transparent;
	}
	.logo {
		width: 64px;
		float: right;
	}
</style>
