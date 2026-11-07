#!/usr/bin/env python3
"""Refresh the bundled, offline NASA Exoplanet Archive snapshot (no API key)."""
import datetime
import json
import math
from pathlib import Path
import urllib.parse
import urllib.request

COLUMNS = (
    'hostname,pl_name,sy_dist,ra,dec,st_rad,st_mass,st_teff,'
    'pl_orbsmax,pl_orbper,pl_rade,pl_bmasse,pl_orbsmax_reflink,'
    'pl_rade_reflink,pl_orbsmaxlim,pl_radelim,pl_controv_flag'
)
QUERY = (f'select {COLUMNS} from pscomppars where sy_dist <= 15 '
         'and pl_controv_flag = 0 order by sy_dist,hostname,pl_name')
URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?' + urllib.parse.urlencode(
    {'query': QUERY, 'format': 'json'})


def main():
    with urllib.request.urlopen(URL, timeout=120) as response:
        rows = json.load(response)
    if not isinstance(rows, list) or not rows:
        raise ValueError('Archive returned no planet rows; keeping existing snapshot')
    hosts = {}
    names = set()
    for row in rows:
        if not row['hostname'] or not row['pl_name'] or row['pl_name'] in names:
            raise ValueError('Missing or duplicate planet identity')
        names.add(row['pl_name'])
        if not all(isinstance(row[key], (int, float)) and math.isfinite(row[key]) for key in ('ra', 'dec')):
            raise ValueError('Missing host coordinates; keeping existing snapshot')
        if not 0 < row['sy_dist'] <= 15 or row['pl_controv_flag'] != 0:
            raise ValueError('Unexpected distance or controversial planet in response')
        host = hosts.setdefault(row['hostname'], {
            'name': row['hostname'], 'distancePc': row['sy_dist'],
            'raDegrees': row['ra'], 'decDegrees': row['dec'],
            'radiusSolar': row['st_rad'], 'massSolar': row['st_mass'],
            'temperatureK': row['st_teff'], 'planets': []})
        for field, column in [('radiusSolar', 'st_rad'), ('massSolar', 'st_mass'), ('temperatureK', 'st_teff')]:
            if host[field] is None and row[column] is not None:
                host[field] = row[column]
        host['planets'].append({
            'name': row['pl_name'], 'semiMajorAxisAu': row['pl_orbsmax'],
            'periodDays': row['pl_orbper'], 'radiusEarth': row['pl_rade'],
            'massEarth': row['pl_bmasse'],
            'orbitReference': row['pl_orbsmax_reflink'],
            'radiusReference': row['pl_rade_reflink'],
            'orbitIsLimit': row['pl_orbsmaxlim'] != 0,
            'radiusIsLimit': row['pl_radelim'] != 0})
    snapshot = {
        'metadata': {
            'source': 'NASA Exoplanet Archive — Planetary Systems Composite Parameters',
            'sourceUrl': 'https://exoplanetarchive.ipac.caltech.edu/',
            'documentationUrl': 'https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html',
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'queryUrl': URL, 'query': QUERY, 'distanceLimitPc': 15,
            'hostCount': len(hosts), 'planetCount': len(names),
            'selection': 'Confirmed composite-table rows within 15 pc, controversial flag = 0.'
        },
        'hosts': list(hosts.values())}
    path = Path(__file__).resolve().parents[1] / 'src/data/exoplanets.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + '\n')
    temporary.replace(path)
    print(f'Saved {len(names)} planets around {len(hosts)} hosts to {path}')


if __name__ == '__main__':
    main()
