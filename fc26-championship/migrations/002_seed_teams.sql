-- FC26 Championship Platform — Default FC Teams Seed
-- Safe to run multiple times (ON CONFLICT DO NOTHING)

insert into fc_teams (name, short_name) values
  ('Real Madrid',        'RMA'),
  ('Barcelona',          'BAR'),
  ('Manchester City',    'MCI'),
  ('Manchester United',  'MUN'),
  ('Arsenal',            'ARS'),
  ('Liverpool',          'LIV'),
  ('Chelsea',            'CHE'),
  ('Bayern Munich',      'BAY'),
  ('PSG',                'PSG'),
  ('Inter',              'INT'),
  ('Milan',              'MIL'),
  ('Juventus',           'JUV'),
  ('Atletico Madrid',    'ATM'),
  ('Tottenham',          'TOT'),
  ('Borussia Dortmund',  'BVB'),
  ('Napoli',             'NAP')
on conflict (name) do nothing;
