# Photographs a student takes of their own patient

Asked for in these words: *"we can upload image as a finding or sign we see in
daily op or patients"*. A case proforma is filled in at the bedside with the
sign in front of you, and before this a photograph of it could only go to the
camera roll, where it lost the one thing that made it useful — which case it
belonged to.

`mobile/src/lib/proformaFindings.ts`, shown under the general examination in
`ClinicalProformaModal`. Camera or gallery, a caption in the student's own
words, resize, delete.

## This never leaves the phone, and here that is not a preference

Every other local-only store in this app is local because the owner decided a
private thing is not ours to copy. This one is local for a harder reason:

**A clinical photograph is identifiable health information about somebody who
is not the user.** It is a patient, in a hospital that has agreed to nothing,
photographed by a student. Uploading it would make this app the custodian of a
stranger's medical record.

Of every rule `check:cloud-ids` enforces, this is the one that may never bend.
`proformaFindings.ts` is in its `LOCAL_ONLY` list and the check fails if that
file so much as imports the Supabase client.

Three consequences, all deliberate:

- **`saveToPhotos` is false.** A patient's sign does not belong in the
  reader's camera roll, where it syncs to whatever cloud backup their phone
  has and lands beside their holiday pictures.
- **Deleting a finding deletes its bytes**, rather than orphaning them. "It
  only costs bytes" is why an orphaned *note* picture is tolerable; it is not
  a reason that applies to a photograph of a patient the student meant to
  remove.
- **The card says so on screen**, before anybody takes a picture. Not as
  reassurance — so they know what they are agreeing to.

## No permission is requested, and none may be added

`launchCamera` fires `ACTION_IMAGE_CAPTURE`, which hands the job to whichever
camera app the reader already has and returns the one picture they took.
`android.permission.CAMERA` is only required **if the manifest declares it** —
declaring it is what turns a no-prompt hand-off into a runtime prompt. So this
app declares nothing and asks nothing, the same rule the photo picker and
`ACTION_OPEN_DOCUMENT` already follow.

## The caption is the student's, never generated

An AI guess at what is in a photograph of a real patient would be this app
putting a diagnosis it cannot support into somebody's case sheet. The field is
theirs to fill.

## Where the bytes live

Through `lib/noteImages` — one downscaled picture per AsyncStorage key, under
`orbit:note-image:{id}`, with this file keeping only the ids and captions.
That store already solves the two problems this has: the picker returns a path
into the *cache* directory which Android empties, and a base64 photograph
inside a list value makes reading the list a multi-megabyte parse.
