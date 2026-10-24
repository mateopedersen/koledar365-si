"""Reverse only Cloudflare's observed email protection markup.

The caller must compare the resulting complete HTML bytes with the local file.
No DOM reserialization, whitespace normalization, or other content is ignored.
"""
import html
import re

HEX = r'[0-9a-fA-F]+'
PLACEHOLDER = r'\[email&#160;protected\]'
EMAIL = re.compile(r'[^\s<>"\x00-\x1f]+@[^\s<>"\x00-\x1f]+')


def restore_email_html(data):
    text = data.decode('utf-8')
    counts = {'email_text': 0, 'mailto_links': 0, 'decoder_scripts': 0}

    def decode(value):
        raw = bytes.fromhex(value)
        return bytes(x ^ raw[0] for x in raw[1:]).decode('utf-8')

    def email_text(match):
        counts['email_text'] += 1
        email = decode(match['hex'])
        if not EMAIL.fullmatch(email):
            raise ValueError('Invalid protected email')
        return html.escape(email, quote=False)

    text = re.sub(r'<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="(?P<hex>'+HEX+r')">'+PLACEHOLDER+r'</a>', email_text, text)
    text = re.sub(r'<span class="__cf_email__" data-cfemail="(?P<hex>'+HEX+r')">'+PLACEHOLDER+r'</span>', email_text, text)

    def mailto(match):
        counts['mailto_links'] += 1
        target = html.unescape(decode(match['hex']))
        address = target.split('?', 1)[0]
        if (address and not EMAIL.fullmatch(address)) or (not address and not target.startswith('?')):
            raise ValueError('Invalid protected mailto target')
        if re.search(r'[\s<>"\x00-\x1f]', target):
            raise ValueError('Invalid protected mailto target')
        return 'href="mailto:' + html.escape(target, quote=True) + '"'

    text = re.sub(r'href="/cdn-cgi/l/email-protection#(?P<hex>'+HEX+r')"', mailto, text)
    if counts['email_text'] or counts['mailto_links']:
        text, counts['decoder_scripts'] = re.subn(r'<script data-cfasync="false" src="/cdn-cgi/scripts/[0-9a-f]{8}/cloudflare-static/email-decode\.min\.js"></script>', '', text)
    return text.encode('utf-8'), counts
