<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { BookingItem } from '$lib/notion';
	import type { PageData, ActionData } from './$types';

	// Extended type with id for booking items
	type BookingItemWithId = BookingItem & { id: string };

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;

	let selectedDuration = $state<string>('');
	let customTitle = $state<string>('Spontaneous meeting');
	let isBooking = $state<boolean>(false);
	let isEndingMeeting = $state<boolean>(false);
	let bookAfterCurrent = $state<boolean>(false);

	// Verfügbarkeit für verschiedene Zeiträume prüfen
	function checkAvailability(durationMinutes: number): boolean {
		const now = new Date();
		const startTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 Minuten Puffer
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

		const allItems = [...currentItems, ...futureItems];

		for (const item of allItems) {
			if (startTime < item.to && endTime > item.from) {
				return false; // Überschneidung
			}
		}

		return true;
	}

	// Prüft ob das aktuelle Meeting in den nächsten 60 Minuten endet
	function canBookAfterCurrentMeeting(): boolean {
		if (currentItems.length === 0) return false;

		const now = new Date();
		const currentMeetingEnd = currentItems[0].to;
		const in60Minutes = new Date(now.getTime() + 60 * 60 * 1000);

		return currentMeetingEnd <= in60Minutes;
	}

	// Verfügbarkeit für Buchung NACH dem aktuellen Meeting prüfen
	function checkAvailabilityAfterCurrent(durationMinutes: number): boolean {
		if (currentItems.length === 0) return false;

		const currentMeetingEnd = currentItems[0].to;
		const startTime = currentMeetingEnd; // Direkt nach aktuellem Meeting
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

		// Prüfe gegen zukünftige Meetings
		for (const item of futureItems) {
			if (startTime < item.to && endTime > item.from) {
				return false; // Überschneidung
			}
		}

		return true;
	}

	// Buchungsoptionen
	function getBookingOptions() {
		const baseOptions = [
			{ duration: 30, label: '30 min' },
			{ duration: 60, label: '1 hrs' },
			{ duration: 90, label: '1,5 hrs' }
		];

		const canBookAfter = canBookAfterCurrentMeeting();

		return baseOptions.map((option) => ({
			...option,
			available: checkAvailability(option.duration),
			availableAfterCurrent: canBookAfter ? checkAvailabilityAfterCurrent(option.duration) : false
		}));
	}

	const bookingOptions = $derived(getBookingOptions());

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: 'Europe/Berlin'
		});
	}

	function getEndTime(durationMinutes: number): string {
		const now = new Date();
		const startTime = new Date(now.getTime() + 2 * 60 * 1000);
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
		return formatTime(endTime);
	}

	function getEndTimeAfterCurrent(durationMinutes: number): string {
		if (currentItems.length === 0) return '';
		const startTime = currentItems[0].to;
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
		return formatTime(endTime);
	}

	function handleCancel() {
		goto(`/${roomParam}`);
	}

	async function handleEndMeeting() {
		const currentItem = currentItems[0] as BookingItemWithId;
		if (!currentItem || !currentItem.id) return;

		isEndingMeeting = true;

		try {
			const response = await fetch(`/api/${roomParam}/end`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					pageId: currentItem.id,
					startTime: currentItem.from.toISOString()
				})
			});

			const result = await response.json();

			if (result.success) {
				// Zurück zur Raum-Übersicht
				goto(`/${roomParam}`);
			} else {
				alert('Fehler beim Beenden des Meetings: ' + result.error);
			}
		} catch (error) {
			console.error('Fehler beim Beenden des Meetings:', error);
			alert('Fehler beim Beenden des Meetings');
		} finally {
			isEndingMeeting = false;
		}
	}
</script>

<svelte:head>
	<title>Book Room - {room?.room || roomParam}</title>
	<meta name="description" content="Quick booking for {room?.room || roomParam}" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Book Room: {room?.room || roomParam}</h1>
		<button class="cancel-btn" onclick={handleCancel}>← Back</button>
	</div>

	{#if !room}
		<div class="error">
			<p>Room "{roomParam}" not found.</p>
		</div>
	{:else}
		<!-- Error/Success Messages -->
		{#if form?.message}
			<div
				class="message {form.message.includes('Failed') || form.message.includes('not available')
					? 'error'
					: 'success'}"
			>
				{form.message}
			</div>
		{/if}

		<!-- Quick Booking Section -->
		<div class="booking-section">
			<h2>Quick Booking</h2>

			{#if currentItems.length === 0}
				<p>Book this room starting in 2 minutes:</p>
			{:else if canBookAfterCurrentMeeting()}
				<p>Room is occupied. Choose booking option:</p>
			{:else}
				<p>Room is occupied for more than 1 hour. Try again later.</p>
			{/if}

			<form
				method="POST"
				action="?/book"
				use:enhance={() => {
					isBooking = true;
					return async ({ update }) => {
						await update();
						isBooking = false;
					};
				}}
			>
				<!-- Duration Selection -->
				<div class="duration-grid">
					{#each bookingOptions as option}
						<!-- Immediate booking option (wenn room frei oder nicht verfügbar) -->
						{#if currentItems.length === 0 && option.available}
							<label class="duration-option">
								<input
									type="radio"
									name="duration"
									value={option.duration}
									bind:group={selectedDuration}
									disabled={isBooking}
									onchange={() => (bookAfterCurrent = false)}
								/>
								<div class="duration-card">
									<div class="duration-time">{option.label}</div>
									<div class="duration-end">Until {getEndTime(option.duration)} Uhr</div>
								</div>
							</label>
						{/if}

						<!-- After current meeting option -->
						{#if currentItems.length > 0 && canBookAfterCurrentMeeting() && option.availableAfterCurrent}
							<label class="duration-option after-current">
								<input
									type="radio"
									name="duration"
									value={option.duration}
									bind:group={selectedDuration}
									disabled={isBooking}
									onchange={() => (bookAfterCurrent = true)}
								/>
								<div class="duration-card">
									<div class="duration-time">{option.label}</div>
									<div class="duration-end">After current meeting</div>
									<div class="duration-details">
										{formatTime(currentItems[0].to)} - {getEndTimeAfterCurrent(option.duration)} Uhr
									</div>
								</div>
							</label>
						{/if}
					{/each}
				</div>

				<!-- Hidden field for after current booking flag -->
				<input type="hidden" name="bookAfterCurrent" value={bookAfterCurrent} />

				<!-- Title Input -->
				<div class="title-section">
					<label for="title">Meeting Title:</label>
					<input
						type="text"
						name="title"
						id="title"
						bind:value={customTitle}
						placeholder="Enter meeting title..."
						required
						disabled={isBooking}
					/>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					class="book-btn"
					disabled={!selectedDuration || !customTitle || isBooking}
				>
					{#if isBooking}
						Booking...
					{:else}
						Book {bookingOptions.find((opt) => opt.duration === Number(selectedDuration))?.label ||
							selectedDuration + ' min'}
					{/if}
				</button>
			</form>
		</div>

		<!-- Current Status -->
		<div class="status-section">
			<h2>Current Status</h2>
			{#if currentItems.length > 0}
				<div class="status occupied">
					<strong>OCCUPIED</strong> until {formatTime(currentItems[0].to)} Uhr
					<br />
					<span class="details"
						>{currentItems[0].title || 'Meeting'} - {currentItems[0].user.join(', ')}</span
					>
				</div>
				<button class="end-meeting-btn" onclick={handleEndMeeting} disabled={isEndingMeeting}>
					{#if isEndingMeeting}
						Ending...
					{:else}
						End Meeting
					{/if}
				</button>
			{:else}
				<div class="status free">
					<strong>FREE</strong> - Available for booking
				</div>
			{/if}
		</div>
		<!-- Future Bookings -->
		{#if futureItems.length > 0}
			<div class="future-section">
				<h2>Upcoming Bookings</h2>
				{#each futureItems as item}
					<div class="future-item">
						<div class="time-range">
							{formatTime(item.from)} - {formatTime(item.to)} Uhr
						</div>
						<div class="item-details">
							<strong>{item.title || 'Meeting'}</strong>
							<br />
							{item.user.join(', ')}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		margin: 0 auto;
		max-width: 600px;
		padding: 20px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		border-bottom: 2px solid #eee;
		padding-bottom: 15px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		color: #333;
	}

	h2 {
		font-size: 18px;
		margin-bottom: 15px;
		color: #555;
	}

	.cancel-btn {
		background: #f5f5f5;
		border: 1px solid #ddd;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		text-decoration: none;
		color: #666;
	}

	.cancel-btn:hover {
		background: #e9e9e9;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 15px;
		border-radius: 4px;
		margin-bottom: 20px;
	}

	.message {
		padding: 15px;
		border-radius: 4px;
		margin-bottom: 20px;
	}

	.message.error {
		background: #fee;
		color: #c33;
		border: 1px solid #fcc;
	}

	.message.success {
		background: #efe;
		color: #3c3;
		border: 1px solid #cfc;
	}

	.status-section,
	.booking-section,
	.future-section {
		margin-bottom: 30px;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.status {
		padding: 15px;
		border-radius: 4px;
		text-align: center;
	}

	.status.occupied {
		background: #fce9e9;
		color: rgb(224, 22, 22);
	}

	.status.free {
		background: #d6fade;
		color: rgb(20, 101, 34);
	}

	.details {
		font-size: 14px;
		opacity: 0.9;
	}

	.end-meeting-btn {
		margin-top: 15px;
		padding: 12px 24px;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		width: 100%;
	}

	.end-meeting-btn:disabled {
		background: #999;
		cursor: not-allowed;
	}

	.end-meeting-btn:not(:disabled):hover {
		background: #c82333;
	}

	.duration-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		margin-bottom: 20px;
	}

	.duration-option {
		cursor: pointer;
	}

	.duration-card {
		border: 2px solid #007bff;
		border-radius: 8px;
		padding: 15px;
		text-align: center;
		transition: all 0.2s ease;
	}

	.duration-option input {
		display: none;
	}

	.duration-option input:checked + .duration-card {
		border-color: #007bff;
		background: #007bff;
		color: #fff;
	}

	.duration-option:not(.disabled):hover .duration-card {
		border-color: #999;
	}

	.duration-time {
		font-size: 18px;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.duration-end {
		font-size: 14px;
		color: #666;
	}

	.duration-details {
		font-size: 12px;
		color: #888;
		margin-top: 4px;
	}

	.duration-option.after-current .duration-card {
		border-color: #28a745;
		background: #f8fff9;
	}

	.duration-option.after-current input:checked + .duration-card {
		border-color: #28a745;
		background: #28a745;
		color: white;
	}
	input:checked + .duration-card .duration-end,
	input:checked + .duration-card .duration-details {
		color: #fff;
	}

	.title-section {
		margin-bottom: 20px;
	}

	.title-section label {
		display: block;
		margin-bottom: 5px;
		font-weight: bold;
	}

	.title-section input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 16px;
	}

	.book-btn {
		width: 100%;
		padding: 15px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
	}

	.book-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.book-btn:not(:disabled):hover {
		background: #0056b3;
	}

	.future-item {
		display: flex;
		gap: 15px;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
	}

	.future-item:last-child {
		border-bottom: none;
	}

	.time-range {
		font-weight: bold;
		white-space: nowrap;
		min-width: 140px;
	}

	.item-details {
		flex: 1;
		font-size: 14px;
	}

	@media (max-width: 600px) {
		.container {
			padding: 15px;
		}

		.header {
			flex-direction: column;
			gap: 10px;
			align-items: stretch;
		}

		.duration-grid {
			grid-template-columns: 1fr;
		}

		.future-item {
			flex-direction: column;
			gap: 5px;
		}
	}
</style>
