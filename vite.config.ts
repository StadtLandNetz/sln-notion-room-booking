import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'process.env.NOTION_TOKEN': JSON.stringify(process.env.NOTION_TOKEN),
		'process.env.NOTION_DATABASE_ID': JSON.stringify(process.env.NOTION_DATABASE_ID),
	  },
});
