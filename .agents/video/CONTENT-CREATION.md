# GMCK Content Creation

Use [GMCK Content Creation](../skills/gmck-content-creation/SKILL.md) for transcript-led reels, ads and medical explainers. It coordinates the existing video skills with the user's established preferences and includes an export-audit helper.

## In ChatGPT

With the personal skill available, attach your clips and ask:

> Use GMCK Content Creation to edit this in four Electric Creator variations with downloaded SFX, no BGM, captions and relevant animation.

For a normal chat that does not load installed skills, provide this link plus your footage:

https://github.com/Sabharivarshan111/gmck/blob/claude/native-app-sync/.agents/skills/gmck-content-creation/SKILL.md

Then say:

> Read this skill and its linked references, analyze my Tamil first, and apply the workflow to my attachments. Use available editing tools; state the specific limitation if this chat cannot render video.

[Normal-chat prompt and Custom Instructions](../skills/gmck-content-creation/references/normal-chat.md) explain the capability-dependent fallback. The file does not itself grant rendering tools or guarantee automatic loading in every chat.

## In a coding assistant

Read `.agents/skills/gmck-content-creation/SKILL.md`, then only the references relevant to the request. Keep media projects outside the installed skill folder. Read the repo's existing HyperFrames/video skills when using those renderers. Do not change ORBIT app code merely to edit a reel.

Before editing, run the skill's [automatic tool preflight](../skills/gmck-content-creation/references/tool-setup.md). It prepares project-local dependencies and verifies actual rendering; optional engines and current chat capabilities must be tested when selected.
