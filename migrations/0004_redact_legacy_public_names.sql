UPDATE messages
SET content = replace(
  replace(
    replace(
      replace(content, 'Agnes-2.0-Flash', '私人助手'),
      'Sapiens AI',
      '服务团队'
    ),
    'Agnes',
    '私人助手'
  ),
  '奶黄包',
  '私人助手'
)
WHERE role = 'assistant';

UPDATE assets
SET filename = replace(filename, 'naihuangbao', 'asset')
WHERE filename LIKE '%naihuangbao%';
