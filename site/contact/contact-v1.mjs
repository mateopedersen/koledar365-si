const root = document.querySelector('[data-contact]');
if (root) {
  const guides = {
    correction: ['Pomagajte nam preveriti podatek.', 'Navedite povezavo do strani, sporni datum in po možnosti uradni vir. Tako lahko preverimo tako zapis kot njegovo razlago.', '/viri-in-metodologija/', 'Kako preverjamo podatke', 'Popravek datuma ali podatka'],
    technical: ['Pokažite nam, kje se je zataknilo.', 'Opišite korake do napake ter navedite napravo in brskalnik. Pri prenosu dodajte vrsto datoteke in ime orodja. Posnetek zaslona lahko pošljete po e-pošti.', '/koledar-za-tiskanje/', 'Odprite koledarje za tisk', 'Težava pri uporabi spletnega mesta'],
    idea: ['Kaj bi vam olajšalo načrtovanje?', 'Opišite, kaj želite narediti, katero orodje uporabljate in kako bi vam predlagana sprememba pomagala. Konkretni primeri so dobrodošli.', '/orodja/', 'Preverite obstoječa orodja', 'Predlog nove funkcije'],
    other: ['Z veseljem preberemo vaše vprašanje.', 'Za sodelovanje opišite predlog in dodajte svoj kontakt. Zahteve glede zasebnosti lahko pošljete neposredno po e-pošti; za obravnavo ne potrebujemo gesel ali osebnih dokumentov.', '/o-nas/', 'Več o projektu Koledar365', 'Sodelovanje ali drugo vprašanje']
  };
  const email = 'koledar365@gmail.com';
  const embed = root.querySelector('[data-contact-embed]');
  const intro = root.querySelector('[data-contact-intro]');
  const frameSlot = root.querySelector('[data-contact-frame]');
  const load = root.querySelector('[data-contact-load]');
  const formURL = root.querySelector('[data-contact-open]').href;
  root.querySelectorAll('[data-contact-topic]').forEach(button => {
    button.addEventListener('click', () => {
      const guide = guides[button.dataset.contactTopic];
      root.querySelectorAll('[data-contact-topic]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      root.querySelector('[data-contact-guide-title]').textContent = guide[0];
      root.querySelector('[data-contact-guide-text]').textContent = guide[1];
      const link = root.querySelector('[data-contact-guide-link]');
      link.href = guide[2];
      link.textContent = `${guide[3]} →`;
      root.querySelector('[data-contact-mail]').href = `mailto:${email}?subject=${encodeURIComponent(`Koledar365 – ${guide[4]}`)}`;
    });
  });
  load.hidden = false;
  load.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    const url = new URL(formURL);
    url.searchParams.set('embedded', 'true');
    frame.src = url.href;
    frame.title = 'Kontaktni obrazec Koledar365 – Google Forms';
    frame.referrerPolicy = 'no-referrer';
    frameSlot.replaceChildren(frame);
    intro.hidden = true;
    embed.hidden = false;
    root.querySelector('[data-contact-close]').focus({preventScroll:true});
  });
  root.querySelector('[data-contact-close]').addEventListener('click', () => {
    frameSlot.replaceChildren();
    embed.hidden = true;
    intro.hidden = false;
    load.focus({preventScroll:true});
  });
  const copy = root.querySelector('[data-contact-copy]');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = root.querySelector('[data-contact-copy-status]');
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'E-poštni naslov je kopiran.';
    } catch {
      status.textContent = 'Kopiranje ni na voljo. Naslov označite in kopirajte ročno: koledar365@gmail.com';
    }
  });
}
