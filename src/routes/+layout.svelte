<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { browser } from '$app/environment';
	let { children } = $props();
</script>

{#if browser && $navigating}
	<div class="loading-indicator">
		<div class="loading-spinner"></div>
		<p>Laden...</p>
	</div>
{/if}

{@render children()}

<style>
	.loading-indicator {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 9999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-indicator p {
		margin: 0;
		font-size: 16px;
		color: #333;
	}
</style>
