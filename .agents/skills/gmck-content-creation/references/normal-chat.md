# Use from ordinary ChatGPT or another assistant

## Invocation

Canonical GMCK copy: https://github.com/Sabharivarshan111/gmck/blob/claude/native-app-sync/.agents/skills/gmck-content-creation/SKILL.md

When the skill is installed and supported, request **GMCK Content Creation** or `$gmck-content-creation` with the video attached. Installed-skill availability can differ by chat surface; a new chat or refreshing the Skills page may be needed. Do not promise universal automatic triggering.

When it is not installed, give the assistant the repository skill link and this prompt (replace SKILL_URL with the actual saved GitHub SKILL.md URL):

> Read SKILL_URL and its linked workflow, styles/sources, runtime/QA and normal-chat references. Apply GMCK Content Creation to my attached clips. First understand the Tamil and correct tool names, then make four distinct Electric Creator edits. Use downloaded reusable SFX, no BGM, original voice, clear subtitles, word-timed logos/strike-throughs, relevant motion graphics, modest zooms and natural colour correction. Trim failed takes and camera-control gestures, preserve native resolution, audit the actual finished files and give working downloads. Choose routine creative details yourself. Tell me honestly if this chat cannot render video; do not pretend you produced a file.

For Custom Instructions or a Project's instructions, a compact reusable preference is:

> For my video/reel requests, use GMCK Content Creation from SKILL_URL. Analyze Tamil first. Default to Electric Creator, real downloaded SFX, no BGM, original voice, English translation captions, relevant logos and animation, natural grading, native resolution and audited exports. Follow my current variation count and timing. Read the linked references when needed. Do the editing when execution tools are available; explain a specific tool limit otherwise.

## Capability-dependent behavior

- **Execution + browsing available:** read the skill and references, fetch assets, produce and verify media.
- **Execution available, external download unavailable:** use supplied licensed assets if appropriate; disclose unavailable downloads and do not silently replace requested downloaded effects with synthesized ones.
- **Browsing only:** analyze the provided accessible transcript/media as supported; produce a timestamped edit/caption/asset plan and runnable source for a capable renderer. Explicitly say no MP4 was rendered in that chat.
- **No repository access:** use the user-attached SKILL.md and references or ask for their text. Do not claim to have read a GitHub URL that could not be opened.
- **No footage/transcript access:** retrieve available authorized attachments/Library files first; ask for only the missing material. Do not invent what the user said.

A repo file does not install tools, grant credentials, preserve scratch files, enable rendering, or change ChatGPT's product capabilities. Keep the workflow portable; use only the tools actually exposed. A saved personal skill can improve automatic routing in supported ChatGPT environments, while the link/prompt remains the explicit fallback elsewhere.
