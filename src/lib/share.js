export async function shareJoinCode(circle) {
  const text = `Join ${circle.personName}'s care circle on EVIE with code ${circle.joinCode}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Join my EVIE care circle', text, url: location.origin });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text}: ${location.origin}`);
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
