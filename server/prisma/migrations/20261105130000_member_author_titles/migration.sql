-- Updates and exception requests written by invited members showed the role the member picked at signup
-- (a contractor who picked "משפץ" appeared as "בעל הבית"). The title now comes from the invite; fix the saved ones.
UPDATE `Update` u
  JOIN `Member` m ON m.`projectId` = u.`projectId` AND m.`userId` = u.`authorId`
  SET u.`authorTitle` = CASE m.`role` WHEN 'professional' THEN 'בעל מקצוע' WHEN 'family' THEN 'משפחה' ELSE 'משפץ' END;

UPDATE `ExceptionReq` e
  JOIN `Member` m ON m.`projectId` = e.`projectId` AND m.`userId` = e.`authorId`
  SET e.`authorTitle` = CASE m.`role` WHEN 'professional' THEN 'בעל מקצוע' WHEN 'family' THEN 'משפחה' ELSE 'משפץ' END;
