# gsd-save-response

Pi extension that adds the `/save-last` slash command to save the most recent
assistant response to a Markdown file in the current working directory.

## Usage

```bash
/save-last                  # saves to response-<timestamp>-<random>.md
/save-last notes            # saves to notes.md
/save-last path/to/file     # saves to path/to/file.md
/save-response              # alias for /save-last
```

If the file name does not end with `.md`, the extension appends it automatically.
Parent directories are created as needed.
