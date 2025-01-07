import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/notion');
  const data = await res.json();

  if (!data.success) {
    console.error('Fehler beim Laden aus Notion:', data.error);
    // Du kannst hier optional ein Error- oder Redirect-Handling einbauen
  }

  return {
    notionData: data.data ?? []
  };
};
