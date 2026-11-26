"""Reverse the observed Cloudflare Search for Agents head insertion only."""


def restore_agent_search_html(data, origin):
    expected = (
        '<meta name="agent:instructions" content="Use this search API to find relevant content '
        'across this site with keywords or natural-language queries, instead of crawling '
        'individual pages. Results are returned in Markdown.">'
        f'<meta name="agent:endpoint" content="{origin}/.well-known/search?q={{query}}">'
        '<meta name="agent:method" content="GET">'
        '<meta name="agent:documentation" '
        'content="https://developers.cloudflare.com/ai-search/how-to/search-for-agents/">'
    ).encode('utf-8')
    start = data.find(b'<head>')
    if start == -1 or data.count(expected) != 1:
        return data, False
    start += len(b'<head>')
    end = data.find(b'</head>', start)
    insertion = data.find(expected, start, end)
    if end == -1 or insertion == -1:
        return data, False
    return data[:insertion] + data[insertion + len(expected):], True
