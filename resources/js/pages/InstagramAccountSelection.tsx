import React from 'react';
import { router } from '@inertiajs/react';

interface Page {
  id: string;
  name: string;
  instagram_business_account: { id: string };
}

interface Props {
  channel: {
    id: number;
    name: string;
    slug: string;
  };
  pages: Page[];
}

const InstagramAccountSelection: React.FC<Props> = ({ channel, pages }) => {
  const [selectedPageId, setSelectedPageId] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPageId) return;
    setSubmitting(true);
    router.post(`/channels/${channel.slug}/instagram/account-selection`, { page_id: selectedPageId }, {
      onFinish: () => setSubmitting(false),
      onError: () => setSubmitting(false),
    });
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">No Instagram Account Found</h2>
        <p>No Instagram Business or Creator account is linked to any of your Facebook Pages. Please link an Instagram account in your Facebook Page settings and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Select Instagram Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Choose a Facebook Page with a linked Instagram account:</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedPageId}
            onChange={e => setSelectedPageId(e.target.value)}
            required
          >
            <option value="">-- Select a Page --</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.name} (Instagram ID: {page.instagram_business_account.id})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={submitting}
        >
          Connect
        </button>
      </form>
    </div>
  );
};

export default InstagramAccountSelection; 