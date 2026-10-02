-- Live migration already applied. Admin and service-role diagram uploads remain available.
drop policy if exists "Allow public upload to diagrams" on storage.objects;
drop policy if exists "Allow public update to diagrams" on storage.objects;
