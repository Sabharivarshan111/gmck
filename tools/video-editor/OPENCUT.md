# Optional OpenCut Classic and professional stabilization

OpenCut Classic has been pinned as a Git submodule at tools/video-editor/opencut-classic.
Source: https://github.com/OpenCut-app/opencut-classic (MIT license)
Commit: cf5e79e919144200294fb9fed22a222592a0aeea

The GitHub repository linked by the user, https://github.com/OpenCut-app/OpenCut,
is a new editor rewrite. Its README says to use Classic for editing today.
Classic itself is archived, so do not confuse it with a maintained renderer.

To use the hosted browser editor, go to https://opencut.app.
To install the optional editor from this repo:
    bash tools/video-editor/start-opencut.sh
This installs only into the isolated submodule checkout, not the Orbit MBBS apps.

For stabilized edits on the original video files, FFmpeg with libvidstab
and a separate OpenCV background tracker were used. An editor UI by itself
does not repair camera motion, clipped headlights, or missing resolution.

Garden original: 2160 x 3840 portrait; actual 1080 x 1920 graded master.
Street original: only 360 x 640 at about 450 kbps; background-aware
motion correction, denoise and Lanczos enlargement to 1080 x 1920.
The street result has 1080p frame dimensions, NOT 1080p source detail.
Output clips preserve original 30fps, original duration, and natural
appearance without optical-flow slow-motion artifacts.

Do not commit personal video footage or exports; this is a public repo.
Do not modify src/, mobile/ or deployment scripts to run the editor.
Editor dependencies and GUI build were not tested from this tool session.
