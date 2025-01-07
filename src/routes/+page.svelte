<script lang="ts">
	import type { BookingItem, Room } from '$lib/notion';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	export let data: PageData;

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

	/**
	 * Wir speichern "now" als Variable.
	 * Svelte erkennt jede Änderung und re-rendert das Template.
	 */
	let now = new Date();

	/**
	 * Für die Anzeige der Uhrzeit im Titel
	 */
	let timeString = now.toLocaleTimeString('de', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	/**
	 * Berechnet die verbleibende Zeit (in Minuten) bis "to"
	 * und wird jedes Mal aufgerufen, wenn "now" neu gesetzt wird.
	 */
	function calculateRemainingTime(to: Date, currentNow: Date): string {
		const diff = to.getTime() - currentNow.getTime();
		const minutes = Math.floor(diff / 60000);
		return `${minutes} min remaining`;
	}

	onMount(() => {
		// 1) Jede Sekunde "now" und "timeString" aktualisieren
		const intervalClock = setInterval(() => {
			now = new Date();
			timeString = now.toLocaleTimeString('de', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		}, 1000);

		// 2) (Optional) Alle 60 Sekunden Seite neu laden
		const intervalReload = setInterval(() => {
			location.reload();
		}, 60_000); // = 1 Minute

		return () => {
			clearInterval(intervalClock);
			clearInterval(intervalReload);
		};
	});
</script>

<div class="container">
	<h1>{timeString} Uhr</h1>

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
			{#each rooms as room}
				{#if room.roomUUID !== ''}
					<!-- Raumüberschrift -->
					<tr>
						<td colspan="4">
							<h2>{room.room}</h2>
							<code>{room.roomUUID}</code>
						</td>
					</tr>

					<!-- Keine Items? -->
					{#if roomItemMap[room.roomUUID].current.length === 0 && roomItemMap[room.roomUUID].future.length === 0}
						<tr>
							<td colspan="4" style="text-align:center; opacity:0.6;">
								Keine Items für diesen Raum
							</td>
						</tr>
					{/if}

					<!-- Aktuelle Buchungen -->
					{#each roomItemMap[room.roomUUID].current as item}
						<tr class="current">
							<td>🗓️ {item.user.join(', ')}</td>
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
							<td>⏱️ {item.user.join(', ')}</td>
							<td>
								{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>
								{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>{item.duration}</td>
						</tr>
					{/each}
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
	h2 {
		margin-top: 1em;
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
		color: #179809;
		font-weight: bold;
		border: 2px solid #abdaa6;
	}
	tr.future {
		/* zukünftige Bookings falls gewünscht stylen */
	}
	code {
		font-size: 12px;
		float: right;
		margin-top: 40px;
	}
</style>
