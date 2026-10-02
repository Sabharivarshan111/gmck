-- Private OCR books are fetched by trusted functions, not anonymous Storage clients.
drop policy if exists "Public Read Textbooks" on storage.objects;
