// Opening the link shows the join form with the code already filled in. The code goes after #,
// which browsers never send to the server, so it stays out of hosting logs.
export const inviteLink = (circle) => `${location.origin}/#join=${encodeURIComponent(circle.joinCode)}`;

// The code from an invite link: #join=… now, or ?join=… from links shared before.
export function inviteCodeFrom(loc = location) {
  const fromHash = new URLSearchParams(loc.hash.replace(/^#/, '')).get('join');
  return fromHash || new URLSearchParams(loc.search).get('join') || '';
}

export async function shareJoinCode(circle) {
  const text = `Join ${circle.personName}'s care circle on EVIE with code ${circle.joinCode}`;
  const url = inviteLink(circle);
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Join my EVIE care circle', text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text}: ${url}`);
    return 'copied';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

export function shareMessage(result, circle) {
  if (result === 'copied') return 'Invite copied.';
  if (result === 'failed') return `Couldn't share. Give them the code ${circle.joinCode}.`;
  return '';
}
