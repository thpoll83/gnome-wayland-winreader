# PolyKybd Window Reporter

A minimal, **read-only** GNOME Shell extension that reports the currently focused
window over D-Bus, so [PolyKybdHost](https://github.com/thpoll83/PolyKybdHost) can
track the active application on GNOME/**Wayland**.

## Why

On GNOME/Wayland, Mutter does not expose the active window over X11/EWMH, so
`pywinctl` can't see native Wayland windows. The usual workaround is the community
**Window Calls** extension (`org.gnome.Shell.Extensions.Windows`) — but that is a
general window-*management* tool: once it is enabled, *any* process on the session
bus can `Move`, `Resize`, `Minimize`, `Activate` or `Close` your windows.

This extension exposes **only** a getter for the focused window. There is no
setter to audit away — the introspection XML declares a single read method, so the
bus cannot route a window-modifying call at all.

## D-Bus contract

| | |
|---|---|
| **Bus name (dest)** | `org.gnome.Shell` |
| **Object path** | `/org/polykybd/WindowReporter` |
| **Interface** | `org.polykybd.WindowReporter` |

### Methods (read-only)

- `GetFocusedWindow() -> String` — a JSON object describing the focused window, or
  the JSON literal `null` when nothing is focused:

  ```json
  {"id": 12345, "wm_class": "firefox", "wm_class_instance": "Navigator", "title": "Mozilla Firefox"}
  ```

  Fields are derived from the focused `MetaWindow`: `id` (`get_id()`, a stable
  opaque handle for the window's lifetime), `wm_class` / `wm_class_instance`, and
  `title` (may be empty — that's fine).

No `Move`/`Resize`/`Activate`/`Close`/anything mutating, ever.

## Install

```sh
git clone https://github.com/thpoll83/gnome-wayland-winreader \
  ~/.local/share/gnome-shell/extensions/window-reporter@polykybd.org

# Wayland can't reload extensions live — log out and back in.
# (On X11 only, you can instead press Alt+F2, type 'r', Enter.)

gnome-extensions enable window-reporter@polykybd.org
```

### Verify

```sh
gdbus call --session --dest org.gnome.Shell \
  --object-path /org/polykybd/WindowReporter \
  --method org.polykybd.WindowReporter.GetFocusedWindow
```

You should get back a one-element tuple containing the JSON string (or `('null',)`
when nothing is focused).

## Compatibility

- GNOME Shell **45–49** (ESM `extension.js`). GNOME 45 introduced the ESM
  extension shape used here.
- The shell APIs this uses — `global.display.get_focus_window()` and the
  `MetaWindow` getters — are stable across these releases, but GNOME's extension
  API can break across majors: re-test on each new GNOME before bumping
  `shell-version` in `metadata.json`.

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
