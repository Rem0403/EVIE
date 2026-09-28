import { describe, expect, it } from 'vitest';
import { cleanResource, dueFollowUps, safeUrl, sortResources, telHref } from './resources.js';

const form = (extra) => ({ name: 'Waiver office', category: 'services', status: 'want', phone: '', url: '', email: '', nextStep: '', nextDate: '', note: '', ...extra });

describe('safeUrl', () => {
  it('accepts web addresses, adding https:// when missing', () => {
    expect(safeUrl('example.org/help')).toBe('https://example.org/help');
    expect(safeUrl(' https://www.211.org/ ')).toBe('https://www.211.org/');
    expect(safeUrl('http://local.example')).toBe('http://local.example/');
  });
  it('refuses anything that is not a web link', () => {
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,hi', 'file:///c:/x', 'not a url', 'ftp://x.org']) {
      expect(safeUrl(bad)).toBeNull();
    }
    expect(safeUrl('')).toBe('');
  });
});

describe('telHref', () => {
  it('keeps only digits and a leading +', () => {
    expect(telHref('(985) 555-0142 ext')).toBe('tel:9855550142');
    expect(telHref('+1 985 555 0142')).toBe('tel:+19855550142');
    expect(telHref('call us')).toBeNull();
  });
});

describe('cleanResource', () => {
  it('trims the form into what is stored', () => {
    expect(cleanResource(form({ name: ' Waiver office ', url: 'dhh.example.gov', phone: ' 555-0142 ', nextStep: ' Call back ', nextDate: '2026-10-03' }))).toEqual([{
      name: 'Waiver office', category: 'services', status: 'want', phone: '555-0142', url: 'https://dhh.example.gov/',
      email: '', nextStep: 'Call back', nextDate: '2026-10-03', note: '',
    }, null]);
  });
  it('explains what is wrong', () => {
    expect(cleanResource(form({ name: ' ' }))[1]).toBe('Give it a name.');
    expect(cleanResource(form({ url: 'javascript:alert(1)' }))[1]).toBe('Enter a website like example.org.');
    expect(cleanResource(form({ email: 'nope' }))[1]).toBe('Enter an email like name@example.org.');
    expect(cleanResource(form({ nextDate: '2026-10-03' }))[1]).toBe('Say what the next step is, or clear the date.');
  });
});

describe('sortResources and dueFollowUps', () => {
  const r = (name, extra) => ({ id: name, name, status: 'want', ...extra });
  const list = [
    r('Zoo club', { status: 'using' }),
    r('Speech therapy', { status: 'not_fit' }),
    r('Waiver', { status: 'waitlisted', nextStep: 'Call', nextDate: '2026-10-05' }),
    r('Parent center', { nextStep: 'Email', nextDate: '2026-09-27' }),
    r('Art group', { status: 'using' }),
  ];
  it('puts follow-ups first (soonest first), then by status, then by name', () => {
    expect(sortResources(list).map((x) => x.name)).toEqual(['Parent center', 'Waiver', 'Art group', 'Zoo club', 'Speech therapy']);
  });
  it('lists follow-ups due today or overdue', () => {
    expect(dueFollowUps(list, new Date(2026, 8, 28, 9).getTime()).map((x) => x.name)).toEqual(['Parent center']);
    expect(dueFollowUps(list, new Date(2026, 9, 5, 9).getTime()).map((x) => x.name)).toEqual(['Parent center', 'Waiver']);
  });
});
